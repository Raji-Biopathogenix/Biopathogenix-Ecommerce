from copy import deepcopy
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock, patch

import requests
from django.test import SimpleTestCase

from payments.qb_payment_sync import record_captured_payment, sync_order_payment


class CapturedPaymentTests(SimpleTestCase):
    def setUp(self):
        self.charge = {'id': 'charge-1', 'status': 'CAPTURED', 'amount': '58.30',
            'currency': 'USD', 'created': '2026-10-08T12:00:00Z', 'authCode': 'auth',
            'context': {'clientTransID': 'settlement-1', 'reconBatchID': 'batch-1'},
            'card': {'number': 'private-card-data', 'cvc': 'private-cvc'}}
        self.invoice = {'Id': 'invoice-1', 'CustomerRef': {'value': 'customer-1'},
            'Balance': 58.30, 'TotalAmt': 58.30}
        self.payment = {'Id': 'payment-1', 'TotalAmt': 58.30,
            'CustomerRef': {'value': 'customer-1'},
            'CreditCardPayment': {'CreditChargeResponse': {'CCTransId': 'charge-1'}},
            'Line': [{'Amount': 58.30, 'LinkedTxn': [
                {'TxnId': 'invoice-1', 'TxnType': 'Invoice'}]}]}

    def response(self, data):
        return Mock(json=lambda: deepcopy(data))

    def record(self):
        return record_captured_payment('token', 'realm', 'https://books.test',
            'https://payments.test', 'customer-1', 'invoice-1', Decimal('58.30'), 'charge-1')

    def setup_get(self, get):
        get.side_effect = [self.response(self.charge), self.response({'QueryResponse': {}}),
                           self.response({'Invoice': self.invoice})]

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_charge_invoice_and_settlement_link_without_another_charge(self, get, post):
        self.setup_get(get)
        post.return_value = self.response({'Payment': self.payment})
        self.assertEqual(self.record()['Id'], 'payment-1')
        payload = post.call_args.kwargs['json']
        self.assertNotIn('DepositToAccountRef', payload)
        self.assertIs(payload['ProcessPayment'], False)
        self.assertEqual(payload['PaymentRefNum'], 'charge-1')
        self.assertEqual(payload['TxnDate'], '2026-10-08')
        metadata = payload['CreditCardPayment']['CreditChargeResponse']
        self.assertEqual(metadata['CCTransId'], 'charge-1')
        self.assertEqual(metadata['ClientTransID'], 'settlement-1')
        self.assertEqual(metadata['ReconBatchId'], 'batch-1')
        self.assertEqual(metadata['Status'], 'Completed')
        self.assertNotIn('private-card-data', str(payload))
        self.assertNotIn('private-cvc', str(payload))
        self.assertTrue(post.call_args.args[0].endswith('/payment'))
        self.assertEqual(post.call_count, 1)

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_repeated_request_has_same_idempotency_key(self, get, post):
        post.return_value = self.response({'Payment': self.payment})
        self.setup_get(get)
        self.record()
        first = post.call_args.kwargs['params']['requestid']
        self.setup_get(get)
        self.record()
        self.assertEqual(post.call_args.kwargs['params']['requestid'], first)

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_existing_payment_reused_after_timeout(self, get, post):
        get.side_effect = [self.response(self.charge),
            self.response({'QueryResponse': {'Payment': [self.payment]}})]
        self.assertEqual(self.record()['Id'], 'payment-1')
        post.assert_not_called()
        self.assertEqual(get.call_count, 2)

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_partial_payment_uses_charge_amount_not_order_total(self, get, post):
        self.invoice.update(Balance=100.0, TotalAmt=200.0)
        self.setup_get(get)
        post.return_value = self.response({'Payment': self.payment})
        self.record()
        self.assertEqual(post.call_args.kwargs['json']['TotalAmt'], 58.30)

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_wrong_charge_identity_status_currency_or_amount_blocks_recording(self, get, post):
        original = deepcopy(self.charge)
        for field, value in [('id', 'other'), ('status', 'DECLINED'), ('currency', 'CAD'),
                             ('amount', '58.31'), ('amount', 'NaN'), ('amount', '58.301')]:
            with self.subTest(field=field, value=value):
                self.charge = {**original, field: value}
                self.setup_get(get)
                with self.assertRaises(ValueError):
                    self.record()
        post.assert_not_called()

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_manual_payment_or_wrong_invoice_blocks_duplicate(self, get, post):
        original = deepcopy(self.invoice)
        for updates in ({'Balance': 0}, {'Balance': 10}, {'Id': 'other'},
                        {'CustomerRef': {'value': 'other'}}, {'CurrencyRef': {'value': 'CAD'}}):
            with self.subTest(updates=updates):
                self.invoice = {**original, **updates}
                self.setup_get(get)
                with self.assertRaises(ValueError):
                    self.record()
        post.assert_not_called()

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_existing_payment_with_wrong_link_or_missing_charge_id_blocks_recreation(self, get, post):
        original = deepcopy(self.payment)
        for updates in ({'CustomerRef': {'value': 'other'}}, {'CreditCardPayment': {}},
                        {'Line': []}, {'TotalAmt': 10}, {'CurrencyRef': {'value': 'CAD'}}):
            with self.subTest(updates=updates):
                payment = {**original, **updates}
                get.side_effect = [self.response(self.charge),
                    self.response({'QueryResponse': {'Payment': [payment]}})]
                with self.assertRaises(ValueError):
                    self.record()
        post.assert_not_called()

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_failed_lookup_never_creates_payment(self, get, post):
        get.side_effect = [self.response(self.charge), self.response({'Fault': {}})]
        with self.assertRaises(ValueError):
            self.record()
        post.assert_not_called()

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_payment_rejection_and_timeout_are_not_reported_as_success(self, get, post):
        self.setup_get(get)
        post.return_value = self.response({'Fault': {}})
        with self.assertRaises(ValueError):
            self.record()
        self.setup_get(get)
        post.side_effect = requests.Timeout('timeout')
        with self.assertRaises(requests.Timeout):
            self.record()


class PaymentRetryTests(SimpleTestCase):
    def setUp(self):
        self.order = SimpleNamespace(qb_payment_sync_pending=True, qb_payment_id='',
            payment_method='card', paymet_status='success', qb_invoice_id='invoice-1',
            qb_customer_id='customer-1', qb_realm_id='realm', amount=Decimal('58.30'),
            transaction_id='charge-1', save=Mock())

    @patch('payments.utils._record_qb_payment')
    @patch('payments.models.QBConfig.get')
    def test_confirmed_payment_clears_pending_flag(self, config, record):
        config.return_value = SimpleNamespace(realm_id='realm', environment='sandbox')
        record.return_value = {'Id': 'payment-1'}
        sync_order_payment(self.order, 'token')
        self.assertFalse(self.order.qb_payment_sync_pending)
        self.assertEqual(self.order.qb_payment_id, 'payment-1')
        self.order.save.assert_called_once_with(update_fields=['qb_payment_id', 'qb_payment_sync_pending'])

    @patch('payments.utils._record_qb_payment', side_effect=requests.Timeout())
    @patch('payments.models.QBConfig.get')
    def test_failed_sync_remains_pending(self, config, record):
        config.return_value = SimpleNamespace(realm_id='realm', environment='sandbox')
        with self.assertRaises(requests.Timeout):
            sync_order_payment(self.order, 'token')
        self.assertTrue(self.order.qb_payment_sync_pending)
        self.order.save.assert_not_called()

    @patch('payments.utils._record_qb_payment')
    @patch('payments.models.QBConfig.get')
    def test_wrong_company_is_not_synced(self, config, record):
        config.return_value = SimpleNamespace(realm_id='other', environment='sandbox')
        with self.assertRaises(ValueError):
            sync_order_payment(self.order, 'token')
        record.assert_not_called()

    @patch('payments.utils._record_qb_payment')
    def test_historical_orders_not_marked_pending_are_untouched(self, record):
        self.order.qb_payment_sync_pending = False
        sync_order_payment(self.order, 'token')
        record.assert_not_called()


class ScheduledPaymentTests(SimpleTestCase):
    @patch('payments.utils.get_valid_qb_token', return_value='token')
    @patch('payments.qb_payment_sync.sync_order_payment')
    @patch('payments.tasks.transaction.atomic')
    @patch('order.models.Order.objects')
    def test_failed_order_does_not_block_other_pending_orders(self, orders, atomic, sync, token):
        from payments.tasks import retry_pending_qb_payments
        orders.filter.return_value.order_by.return_value.values_list.return_value = [1, 2]
        orders.select_for_update.return_value.get.side_effect = [
            SimpleNamespace(qb_payment_sync_pending=True),
            SimpleNamespace(qb_payment_sync_pending=True)]
        sync.side_effect = [requests.Timeout(), None]
        self.assertEqual(retry_pending_qb_payments(), 1)
        self.assertEqual(sync.call_count, 2)

    @patch('payments.utils.get_valid_qb_token')
    @patch('order.models.Order.objects')
    def test_empty_queue_does_not_contact_intuit(self, orders, token):
        from payments.tasks import retry_pending_qb_payments
        orders.filter.return_value.order_by.return_value.values_list.return_value = []
        self.assertEqual(retry_pending_qb_payments(), 0)
        token.assert_not_called()

    @patch('payments.utils.get_valid_qb_token', return_value='token')
    @patch('payments.qb_payment_sync.sync_order_payment')
    @patch('payments.tasks.transaction.atomic')
    @patch('order.models.Order.objects')
    def test_order_completed_during_poll_is_skipped(self, orders, atomic, sync, token):
        from payments.tasks import retry_pending_qb_payments
        orders.filter.return_value.order_by.return_value.values_list.return_value = [1]
        orders.select_for_update.return_value.get.return_value = SimpleNamespace(qb_payment_sync_pending=False)
        self.assertEqual(retry_pending_qb_payments(), 0)
        sync.assert_not_called()
