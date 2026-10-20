from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch, Mock

import requests
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from order import whole_refunds as service
from order.models import Order, OrderRefund
from order.views import RefundOrderView
from payments.tasks import retry_pending_qb_refunds


@override_settings(GRAPH_ENABLED=False, EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class WholeRefundTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create(email='customer@example.test', is_active=True)
        self.admin = get_user_model().objects.create(email='staff@example.test', is_staff=True, is_active=True)
        self.order = Order.objects.create(user=self.user, transaction_id='charge', status='returned',
            amount=Decimal('20'), paymet_status='success', payment_method='card',
            qb_realm_id='realm', qb_customer_id='customer', qb_invoice_id='invoice')
        self.config = patch.object(service.QBConfig, 'get', return_value=SimpleNamespace(realm_id='realm', environment='sandbox')).start()
        self.token = patch.object(service, 'get_valid_qb_token', return_value='token').start()
        self.refund = patch.object(service, 'refund_qb_charge', return_value={'id': 'provider-refund', 'status': 'ISSUED'}).start()
        self.receipt = patch.object(service, 'create_qb_refund_receipt', return_value={'Id': 'receipt'}).start()
        self.addCleanup(patch.stopall)

    def prepare(self):
        return service.prepare(self.order.pk, Decimal('5'), self.admin, 'Requested', 'staff-reference')

    def test_accounting_failure_retains_provider_id_and_retries_only_accounting(self):
        op = self.prepare()
        self.receipt.side_effect = requests.Timeout()
        op = service.process(op.pk)
        self.assertEqual(op.state, 'accounting_pending')
        self.assertEqual(op.refund_id, 'provider-refund')
        self.assertTrue(op.error)
        self.order.refresh_from_db()
        self.assertEqual(self.order.refund_reference, 'staff-reference')
        self.assertEqual(self.order.qb_refund_id, 'provider-refund')
        self.assertEqual(self.order.refund_accounting_state, 'accounting_pending')
        self.receipt.side_effect = None
        self.assertEqual(retry_pending_qb_refunds(), 1)
        op.refresh_from_db()
        self.assertEqual(op.state, 'complete')
        self.assertEqual(op.accounting_id, 'receipt')
        self.assertEqual(self.refund.call_count, 1)
        self.assertTrue(self.receipt.call_args.kwargs['recoverable'])

    def test_intent_and_request_id_are_committed_before_provider_submission(self):
        op = self.prepare()
        def submit(*args, **kwargs):
            saved = OrderRefund.objects.get(pk=op.pk)
            self.assertEqual(saved.state, 'submitting')
            self.assertEqual(kwargs['request_id'], str(saved.key))
            return {'id': 'provider-refund', 'status': 'ISSUED'}
        self.refund.side_effect = submit
        self.assertEqual(service.process(op.pk).state, 'complete')

    def test_pending_provider_polled_without_creating_another_refund(self):
        self.refund.return_value = {'id': 'provider-refund', 'status': 'PENDING'}
        op = service.process(self.prepare().pk)
        self.assertEqual(op.state, 'provider_pending')
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'returned')
        self.assertIsNone(self.order.refund_amount)
        self.receipt.assert_not_called()
        response = Mock(json=lambda: {'id': 'provider-refund', 'status': 'ISSUED', 'amount': '5.00'})
        with patch.object(service.requests, 'get', return_value=response):
            self.assertEqual(retry_pending_qb_refunds(), 1)
        self.assertEqual(self.refund.call_count, 1)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'partially_refunded')

    def test_pending_status_remains_visible_until_issued(self):
        self.refund.return_value = {'id': 'provider-refund', 'status': 'PENDING'}
        op = service.process(self.prepare().pk)
        response = Mock(json=lambda: {'id': 'provider-refund', 'status': 'PENDING', 'amount': '5.00'})
        with patch.object(service.requests, 'get', return_value=response):
            self.assertEqual(retry_pending_qb_refunds(), 0)
        op.refresh_from_db()
        self.assertEqual(op.state, 'provider_pending')
        self.receipt.assert_not_called()
        self.assertEqual(self.refund.call_count, 1)

    def test_pending_refund_cannot_be_started_again_from_eligibility(self):
        self.refund.return_value = {'id': 'provider-refund', 'status': 'PENDING'}
        service.process(self.prepare().pk)
        self.order.refresh_from_db()
        self.assertFalse(self.order.is_refundable)

    def test_customer_confirmation_sent_once_only_after_provider_issues_refund(self):
        with patch.object(service, 'send_refund_email', return_value=True) as email:
            with self.captureOnCommitCallbacks(execute=True):
                op = service.process(self.prepare().pk)
            self.assertEqual(email.call_count, 1)
            service.process(op.pk)
            self.assertEqual(email.call_count, 1)
            op.refresh_from_db()
            self.assertTrue(op.email_sent)

    def test_provider_timeout_requires_verified_recovery_never_another_refund(self):
        self.refund.side_effect = requests.Timeout()
        op = service.process(self.prepare().pk)
        self.assertEqual(op.state, 'review')
        self.assertTrue(op.error)
        service.process(op.pk)
        self.assertEqual(retry_pending_qb_refunds(), 0)
        self.assertEqual(self.refund.call_count, 1)
        response = Mock(json=lambda: {'id': 'found-refund', 'status': 'ISSUED', 'amount': '5.00'})
        with patch.object(service.requests, 'get', return_value=response):
            service.recover(op.pk, 'found-refund')
        self.assertEqual(service.process(op.pk).state, 'complete')
        self.assertEqual(self.refund.call_count, 1)

    def test_missing_provider_id_is_reviewed_not_reported_as_refunded(self):
        self.refund.return_value = {'status': 'ISSUED'}
        op = service.process(self.prepare().pk)
        self.assertEqual(op.state, 'review')
        self.receipt.assert_not_called()
        self.order.refresh_from_db()
        self.assertIsNone(self.order.refund_amount)

    def test_duplicate_submission_reuses_one_operation_and_one_refund(self):
        op = service.process(self.prepare().pk)
        duplicate = self.prepare()
        self.assertEqual(op.pk, duplicate.pk)
        service.process(duplicate.pk)
        self.assertEqual(OrderRefund.objects.count(), 1)
        self.assertEqual(self.refund.call_count, 1)
        self.assertEqual(self.receipt.call_count, 1)

    def test_duplicate_with_changed_amount_is_rejected(self):
        self.prepare()
        with self.assertRaises(ValueError):
            service.prepare(self.order.pk, Decimal('6'), self.admin)

    def test_declined_refund_does_not_create_accounting_or_complete_order(self):
        self.refund.return_value = {'id': 'declined-refund', 'status': 'DECLINED'}
        op = service.process(self.prepare().pk)
        self.assertEqual(op.state, 'failed')
        self.receipt.assert_not_called()
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'returned')

    def test_company_change_blocks_all_external_writes(self):
        op = self.prepare()
        self.config.return_value.realm_id = 'other'
        op = service.process(op.pk)
        self.assertEqual(op.state, 'ready')
        self.assertTrue(op.error)
        self.refund.assert_not_called()
        self.receipt.assert_not_called()

    def test_wrong_refund_amount_cannot_recover(self):
        op = self.prepare()
        OrderRefund.objects.filter(pk=op.pk).update(state='review')
        response = Mock(json=lambda: {'id': 'found', 'status': 'ISSUED', 'amount': '6.00'})
        with patch.object(service.requests, 'get', return_value=response), self.assertRaises(ValueError):
            service.recover(op.pk, 'found')
        op.refresh_from_db()
        self.assertEqual(op.refund_id, '')
        self.assertEqual(op.state, 'review')

    def test_api_reports_accounting_pending_and_saved_provider_reference(self):
        self.receipt.side_effect = requests.Timeout()
        request = APIRequestFactory().post('/refund/', {'refund_amount': '5.00', 'refund_reference': 'staff-note'}, format='json')
        force_authenticate(request, user=self.admin)
        response = RefundOrderView.as_view()(request, order_id=self.order.pk)
        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data['data']['qb_refund_id'], 'provider-refund')
        self.assertTrue(response.data['data']['refund_accounting_pending'])

    def test_worker_continues_after_one_refund_failure(self):
        with patch('order.models.OrderRefund.objects') as objects, patch.object(service, 'process') as process:
            objects.filter.return_value.order_by.return_value.values_list.return_value = [1, 2]
            process.side_effect = [RuntimeError(), SimpleNamespace(state='complete')]
            self.assertEqual(retry_pending_qb_refunds(), 1)
            self.assertEqual(process.call_count, 2)
