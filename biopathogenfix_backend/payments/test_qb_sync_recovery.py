from copy import deepcopy
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock, patch
from io import StringIO

import requests
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import SimpleTestCase, TestCase

from order.models import Order
from payments.qb_payment_sync import find_order_invoice, inspect_order_accounting, invoice_marker, sync_order_payment
from payments.utils import create_qb_invoice


class RecoveryTests(SimpleTestCase):
    def setUp(self):
        self.order = SimpleNamespace(id=101, transaction_id='charge-101', amount=Decimal('290.44'),
            qb_realm_id='realm', qb_customer_id='customer', qb_invoice_id='', qb_payment_id='',
            qb_payment_sync_pending=True, payment_method='card', paymet_status='success',
            status='confirmed', save=Mock(), items=Mock(), user=Mock())
        self.invoice = {'Id': 'invoice-101', 'CustomerRef': {'value': 'customer'},
                        'TotalAmt': 290.44, 'Balance': 290.44,
                        'PrivateNote': invoice_marker(self.order, 'realm')}

    def response(self, data):
        return Mock(json=lambda: deepcopy(data))

    @patch('payments.utils.create_qb_invoice')
    @patch('payments.models.QBConfig.get')
    def test_invoice_creation_failure_is_retryable(self, config, create):
        config.return_value = SimpleNamespace(realm_id='realm')
        create.side_effect = requests.Timeout()
        with self.assertRaises(requests.Timeout):
            sync_order_payment(self.order, 'token')
        self.assertTrue(self.order.qb_payment_sync_pending)
        create.side_effect = None
        sync_order_payment(self.order, 'token')
        self.assertEqual(create.call_count, 2)

    @patch('payments.utils.create_qb_invoice')
    @patch('payments.models.QBConfig.get')
    def test_refunded_order_is_not_reposted(self, config, create):
        config.return_value = SimpleNamespace(realm_id='realm')
        self.order.status = 'refunded'
        with self.assertRaises(ValueError):
            sync_order_payment(self.order, 'token')
        create.assert_not_called()

    @patch('payments.qb_payment_sync.requests.get')
    def test_invoice_recovers_after_lost_response_and_checks_pagination(self, get):
        get.side_effect = [self.response({'QueryResponse': {'Invoice': [{}] * 1000}}),
                           self.response({'QueryResponse': {'Invoice': [self.invoice]}})]
        result = find_order_invoice('token', 'realm', 'url', 'customer', self.order)
        self.assertEqual(result['Id'], 'invoice-101')
        self.assertIn('STARTPOSITION 1001', get.call_args.kwargs['params']['query'])

    @patch('payments.qb_payment_sync.requests.get')
    def test_duplicate_or_wrong_amount_invoice_requires_review(self, get):
        for invoices in ([self.invoice, self.invoice], [{**self.invoice, 'TotalAmt': 280.27}]):
            get.return_value = self.response({'QueryResponse': {'Invoice': invoices}})
            with self.assertRaises(ValueError):
                find_order_invoice('token', 'realm', 'url', 'customer', self.order)

    @patch('payments.utils.requests.post')
    @patch('payments.utils._record_qb_payment', return_value={'Id': 'payment-101'})
    @patch('payments.qb_payment_sync.find_order_invoice')
    @patch('payments.utils.QBConfig.get')
    def test_recovered_invoice_is_reused_without_posting_another(self, config, lookup, record, post):
        config.return_value = SimpleNamespace(realm_id='realm', environment='sandbox')
        lookup.return_value = self.invoice
        create_qb_invoice('token', self.order, [], 'card', self.order.user)
        post.assert_not_called()
        self.assertEqual(self.order.qb_invoice_id, 'invoice-101')
        self.assertFalse(self.order.qb_payment_sync_pending)
        self.assertEqual(record.call_args.kwargs['amount'], 290.44)

    @patch('payments.utils.get_qb_location_id', return_value=None)
    @patch('payments.utils._build_invoice_line_items', return_value=[])
    @patch('payments.utils.get_or_create_qb_item', return_value='item')
    @patch('payments.qb_payment_sync.find_order_invoice', return_value=None)
    @patch('payments.utils.requests.post', side_effect=requests.Timeout())
    @patch('payments.utils.QBConfig.get')
    def test_invoice_timeout_reuses_request_id_on_retry(self, config, post, lookup, item, lines, location):
        config.return_value = SimpleNamespace(realm_id='realm', environment='sandbox')
        for field in ('customer_notes', 'billing_address_line1', 'billing_city', 'billing_state_code',
                      'billing_postal_code', 'shipping_address_line1', 'shipping_city',
                      'shipping_state_code', 'shipping_postal_code', 'shipping_email'):
            setattr(self.order, field, '')
        for attempt in range(2):
            with self.assertRaises(requests.Timeout):
                create_qb_invoice('token', self.order, [], 'card', self.order.user)
        calls = post.call_args_list
        self.assertEqual(calls[0].kwargs['params']['requestid'], calls[1].kwargs['params']['requestid'])
        self.assertEqual(calls[0].kwargs['json']['PrivateNote'], invoice_marker(self.order, 'realm'))
        self.assertTrue(self.order.qb_payment_sync_pending)


class DepositInspectionTests(SimpleTestCase):
    def setUp(self):
        self.order = SimpleNamespace(qb_realm_id='realm', qb_customer_id='customer',
            qb_invoice_id='invoice-101', transaction_id='charge-101', amount=Decimal('290.44'))
        self.payment = {'Id': 'payment-101', 'TotalAmt': 290.44,
            'CustomerRef': {'value': 'customer'},
            'CreditCardPayment': {'CreditChargeResponse': {'CCTransId': 'charge-101'}},
            'Line': [{'Amount': 290.44, 'LinkedTxn': [{'TxnId': 'invoice-101', 'TxnType': 'Invoice'}]}]}

    def response(self, data):
        return Mock(json=lambda: deepcopy(data))

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_gross_payment_and_net_deposit_remain_distinct(self, get, post):
        deposit = {'Id': 'deposit-1', 'TotalAmt': 280.27, 'TxnDate': '2026-10-09',
            'DepositToAccountRef': {'value': 'bank'},
            'Line': [{'Amount': 290.44, 'LinkedTxn': [{'TxnId': 'payment-101', 'TxnType': 'Payment'}]},
                     {'Amount': -10.17, 'DepositLineDetail': {'AccountRef': {'value': 'fees'}}}]}
        get.side_effect = [self.response({'QueryResponse': {'Payment': [self.payment]}}),
                           self.response({'QueryResponse': {'Deposit': [deposit]}})]
        report = inspect_order_accounting(self.order, 'token', 'realm', 'url')
        self.assertEqual(report['status'], 'linked_deposit_found')
        self.assertEqual(report['deposits'][0]['batch_total'], 280.27)
        self.assertEqual(report['deposits'][0]['payment_amount'], '290.44')
        post.assert_not_called()

    @patch('payments.qb_payment_sync.requests.get')
    def test_recorded_payment_is_not_reported_as_a_recorded_deposit(self, get):
        get.side_effect = [self.response({'QueryResponse': {'Payment': [self.payment]}}),
                           self.response({'QueryResponse': {}})]
        report = inspect_order_accounting(self.order, 'token', 'realm', 'url')
        self.assertEqual(report['status'], 'linked_deposit_not_found')

    @patch('payments.qb_payment_sync.requests.get')
    def test_failed_deposit_query_is_not_reported_as_missing(self, get):
        get.side_effect = [self.response({'QueryResponse': {'Payment': [self.payment]}}),
                           self.response({'Fault': {}})]
        with self.assertRaises(ValueError):
            inspect_order_accounting(self.order, 'token', 'realm', 'url')


class RetryProgressTests(TestCase):
    @patch('payments.qb_payment_sync.sync_order_payment', side_effect=requests.Timeout())
    @patch('order.views.QBConfig.get')
    @patch('order.views.ProductSKU.objects.filter')
    @patch('order.views.CartVariants.objects.filter')
    @patch('order.views.OrderItem.objects.create')
    @patch('prd_variant.resolution.sku_for_item')
    def test_checkout_enqueues_accounting_before_invoice_attempt(self, resolve, item_create, variants, stock, config, sync):
        from order.views import _create_order
        user = get_user_model().objects.create(email='qb-checkout@example.test')
        config.return_value = SimpleNamespace(realm_id='realm')
        sku = SimpleNamespace(id=1, pk=1, stock=1, sku_code='EPCR-5',
                              weight=0, length=0, width=0, height=0)
        resolve.return_value = sku
        # The queried variants also provide delete(); use a queryset mock.
        variants.return_value = Mock(__iter__=Mock(return_value=iter([])))
        product = SimpleNamespace(name='RNase P Verification Plate')
        cart_item = Mock(id=1, product=product, quantity=1, price=Decimal('250'))
        data = {'shipping': {'first_name': 'Test', 'last_name': 'User',
                            'address_line1': '123 Example St', 'city': 'Nicholasville',
                            'postal_code': '40356', 'country': 'US',
                            'state_code': 'KY', 'state_name': 'Kentucky'},
                'billing': {}, 'subtotal': 250, 'shipping_cost': 19.50, 'tax_amount': 20.94}
        response = _create_order(data, user, 'charge-checkout', 'checkout-key', Decimal('290.44'),
                                 'card', '4009', 'amex', 'Test User', 'confirmed', [cart_item], 'token')
        self.assertEqual(response.status_code, 201)
        order = Order.objects.get(transaction_id='charge-checkout')
        self.assertTrue(order.qb_payment_sync_pending)
        self.assertEqual(order.qb_realm_id, 'realm')
        self.assertEqual(order.amount, Decimal('290.44'))
        sync.assert_called_once()

    @patch('payments.utils.get_valid_qb_token', return_value='token')
    @patch('payments.qb_payment_sync.sync_order_payment')
    def test_invoice_link_survives_a_subsequent_payment_failure(self, sync, token):
        from payments.tasks import retry_pending_qb_payments
        user = get_user_model().objects.create(email='qb-recovery@example.test')
        order = Order.objects.create(user=user, transaction_id='charge-progress',
            amount=Decimal('290.44'), qb_payment_sync_pending=True, qb_realm_id='realm')

        def save_invoice_then_fail(pending, access_token):
            pending.qb_invoice_id = 'invoice-progress'
            pending.save(update_fields=['qb_invoice_id'])
            raise requests.Timeout()

        sync.side_effect = save_invoice_then_fail
        self.assertEqual(retry_pending_qb_payments(), 0)
        order.refresh_from_db()
        self.assertEqual(order.qb_invoice_id, 'invoice-progress')
        self.assertTrue(order.qb_payment_sync_pending)


class ReconciliationCommandTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create(email='qb-command@example.test')
        self.order = Order.objects.create(user=self.user, transaction_id='charge-command',
            amount=Decimal('290.44'), qb_realm_id='realm', qb_customer_id='customer',
            qb_invoice_id='invoice', paymet_status='success')

    @patch('order.management.commands.reconcile_qb_payment.get_valid_qb_token', return_value='token')
    @patch('order.management.commands.reconcile_qb_payment.QBConfig.get')
    @patch('order.management.commands.reconcile_qb_payment.inspect_order_accounting')
    @patch('order.management.commands.reconcile_qb_payment.sync_order_payment')
    def test_default_command_only_inspects(self, sync, inspect, config, token):
        config.return_value = SimpleNamespace(realm_id='realm', environment='sandbox')
        inspect.return_value = {'status': 'linked_deposit_not_found'}
        call_command('reconcile_qb_payment', self.order.pk, stdout=StringIO())
        inspect.assert_called_once()
        sync.assert_not_called()
        self.order.refresh_from_db()
        self.assertFalse(self.order.qb_payment_sync_pending)

    @patch('order.management.commands.reconcile_qb_payment.get_valid_qb_token', return_value='token')
    @patch('order.management.commands.reconcile_qb_payment.QBConfig.get')
    @patch('order.management.commands.reconcile_qb_payment.sync_order_payment')
    def test_historical_order_without_invoice_is_not_guessed(self, sync, config, token):
        self.order.qb_invoice_id = ''
        self.order.save(update_fields=['qb_invoice_id'])
        with self.assertRaises(CommandError):
            call_command('reconcile_qb_payment', self.order.pk, resume=True, stdout=StringIO())
        sync.assert_not_called()

    @patch('order.management.commands.reconcile_qb_payment.get_valid_qb_token', return_value='token')
    @patch('order.management.commands.reconcile_qb_payment.QBConfig.get')
    @patch('payments.utils._record_qb_payment', return_value={'Id': 'payment-recovered'})
    def test_explicit_historical_repair_keeps_original_amount(self, record, config, token):
        config.return_value = SimpleNamespace(realm_id='realm', environment='sandbox')
        call_command('reconcile_qb_payment', self.order.pk, resume=True, stdout=StringIO())
        self.order.refresh_from_db()
        self.assertEqual(self.order.amount, Decimal('290.44'))
        self.assertEqual(self.order.qb_payment_id, 'payment-recovered')
        self.assertFalse(self.order.qb_payment_sync_pending)
