from copy import deepcopy
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock, patch

import requests
from django.test import SimpleTestCase, override_settings

from payments.qb_payment_sync import record_intuit_refund_receipt


class RefundAccountingTests(SimpleTestCase):
    def setUp(self):
        self.refund = {'id': 'refund-1', 'status': 'ISSUED', 'amount': '5.00'}
        self.invoice = {'Id': 'invoice-1', 'TotalAmt': 20,
                        'CustomerRef': {'value': 'customer-1'}}
        self.marker = 'Intuit refund refund-1; charge charge-1; invoice invoice-1'
        self.receipt = {'Id': 'receipt-1', 'TotalAmt': 5,
                        'CustomerRef': {'value': 'customer-1'},
                        'TxnSource': 'IntuitPayment', 'PrivateNote': self.marker}
        self.payload = {'CustomerRef': {'value': 'customer-1'},
                        'PrivateNote': 'Website order 123',
                        'Line': [{'Amount': 5, 'DetailType': 'SalesItemLineDetail'}]}

    def response(self, data):
        return Mock(json=lambda: deepcopy(data))

    def setup_get(self, get, receipts=None):
        get.side_effect = [self.response(self.refund), self.response({'Invoice': self.invoice}),
                          self.response({'QueryResponse': {'RefundReceipt': receipts or []}})]

    def record(self):
        return record_intuit_refund_receipt('token', 'realm', 'https://books.test',
            'https://payments.test', 'customer-1', 'invoice-1', 'charge-1',
            'refund-1', Decimal('5.00'), self.payload)

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_issued_refund_recorded_with_source_and_original_references(self, get, post):
        self.setup_get(get)
        post.return_value = self.response({'RefundReceipt': self.receipt})
        self.assertEqual(self.record()['Id'], 'receipt-1')
        self.assertIn('/charges/charge-1/refunds/refund-1', get.call_args_list[0].args[0])
        payload = post.call_args.kwargs['json']
        self.assertEqual(payload['TxnSource'], 'IntuitPayment')
        self.assertEqual(payload['CreditCardPayment']['CreditChargeResponse']['CCTransId'], 'refund-1')
        self.assertIn(self.marker, payload['PrivateNote'])
        self.assertIn('Website order 123', payload['PrivateNote'])
        self.assertEqual(self.payload['PrivateNote'], 'Website order 123')
        self.assertTrue(post.call_args.args[0].endswith('/refundreceipt'))
        self.assertNotIn('ProcessPayment', payload)

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_retry_recovers_existing_receipt_without_another_post(self, get, post):
        self.setup_get(get, [self.receipt])
        self.assertEqual(self.record()['Id'], 'receipt-1')
        post.assert_not_called()

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_recovery_can_run_with_source_feature_disabled(self, get, post):
        self.setup_get(get)
        receipt = {key: value for key, value in self.receipt.items() if key != 'TxnSource'}
        post.return_value = self.response({'RefundReceipt': receipt})
        result = record_intuit_refund_receipt('token', 'realm', 'https://books.test',
            'https://payments.test', 'customer-1', 'invoice-1', 'charge-1',
            'refund-1', Decimal('5.00'), self.payload, intuit_payment_linking=False)
        self.assertEqual(result['Id'], 'receipt-1')
        self.assertNotIn('TxnSource', post.call_args.kwargs['json'])
        self.assertNotIn('CreditCardPayment', post.call_args.kwargs['json'])

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_repeated_submission_uses_same_request_id(self, get, post):
        post.return_value = self.response({'RefundReceipt': self.receipt})
        self.setup_get(get)
        self.record()
        first = post.call_args.kwargs['params']['requestid']
        self.setup_get(get)
        self.record()
        self.assertEqual(first, post.call_args.kwargs['params']['requestid'])

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_unissued_wrong_refund_or_wrong_amount_cannot_record(self, get, post):
        for updates in ({'status': 'PENDING'}, {'status': 'DECLINED'},
                        {'id': 'other'}, {'amount': '5.01'}):
            with self.subTest(updates=updates):
                get.side_effect = [self.response({**self.refund, **updates})]
                with self.assertRaises(ValueError):
                    self.record()
        post.assert_not_called()

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_wrong_invoice_customer_currency_or_total_blocks_receipt(self, get, post):
        original = self.invoice
        for updates in ({'Id': 'other'}, {'CustomerRef': {'value': 'other'}},
                        {'CurrencyRef': {'value': 'CAD'}}, {'TotalAmt': 1}):
            with self.subTest(updates=updates):
                self.invoice = {**original, **updates}
                self.setup_get(get)
                with self.assertRaises(ValueError):
                    self.record()
        post.assert_not_called()

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_existing_conflicting_or_duplicate_receipts_never_recreated(self, get, post):
        for receipts in ([{**self.receipt, 'TotalAmt': 9}],
                         [{**self.receipt, 'TxnSource': 'other'}],
                         [self.receipt, self.receipt]):
            with self.subTest(receipts=receipts):
                self.setup_get(get, receipts)
                with self.assertRaises(ValueError):
                    self.record()
        post.assert_not_called()

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_timeout_then_retry_recovers_record_without_duplicate(self, get, post):
        self.setup_get(get)
        post.side_effect = requests.Timeout()
        with self.assertRaises(requests.Timeout):
            self.record()
        self.setup_get(get, [self.receipt])
        self.assertEqual(self.record()['Id'], 'receipt-1')
        self.assertEqual(post.call_count, 1)

    @patch('payments.qb_payment_sync.requests.post')
    @patch('payments.qb_payment_sync.requests.get')
    def test_failed_lookup_does_not_create_receipt(self, get, post):
        get.side_effect = [self.response(self.refund), self.response({'Invoice': self.invoice}),
                          self.response({'Fault': {}})]
        with self.assertRaises(ValueError):
            self.record()
        post.assert_not_called()


class RefundHandlerRoutingTests(SimpleTestCase):
    def test_missing_item_charge_fails_clearly_before_startswith(self):
        from order.item_cancellations import Books
        books = Books.__new__(Books)
        for charge_id in (None, ''):
            with self.subTest(charge_id=charge_id), self.assertRaisesMessage(ValueError, 'reference is missing'):
                books.record_refund(SimpleNamespace(order=SimpleNamespace(transaction_id=charge_id)))

    @override_settings(QB_INTUIT_PAYMENT_LINKING_ENABLED=True)
    @patch('payments.qb_payment_sync.record_intuit_refund_receipt')
    @patch('payments.utils.get_or_create_qb_item', return_value='item')
    @patch('payments.utils.requests.get')
    @patch('payments.models.QBConfig.get')
    def test_whole_order_helper_passes_original_references(self, config, get, item, record):
        from payments.utils import create_qb_refund_receipt
        config.return_value = SimpleNamespace(realm_id='realm', environment='sandbox')
        get.return_value = Mock(json=lambda: {'QueryResponse': {'Account': [{'Id': 'funds'}]}})
        record.return_value = {'Id': 'receipt'}
        result = create_qb_refund_receipt('token', 'customer', 5, 'Order 123',
            charge_id='charge', refund_id='refund', invoice_id='invoice')
        self.assertEqual(result['Id'], 'receipt')
        self.assertEqual(record.call_args.args[4:9], ('customer', 'invoice', 'charge', 'refund', 5))

    @override_settings(QB_INTUIT_PAYMENT_LINKING_ENABLED=True)
    @patch('payments.qb_payment_sync.record_intuit_refund_receipt')
    @patch('payments.models.QBConfig.get')
    def test_item_handler_uses_same_verified_recorder(self, config, record):
        from order.item_cancellations import Books
        config.return_value = SimpleNamespace(realm_id='realm', environment='sandbox')
        order = SimpleNamespace(qb_realm_id='realm', qb_customer_id='customer',
                                qb_invoice_id='invoice', transaction_id='charge')
        op = SimpleNamespace(order=order, refund_id='refund', amount=Decimal('5'), accounting_payload={})
        books = Books.__new__(Books)
        books.token = 'token'
        books.record_refund(op)
        self.assertEqual(record.call_args.args[4:9], ('customer', 'invoice', 'charge', 'refund', Decimal('5')))

    @override_settings(QB_INTUIT_PAYMENT_LINKING_ENABLED=True)
    @patch('payments.qb_payment_sync.record_intuit_refund_receipt')
    def test_stripe_refunds_keep_existing_accounting_path(self, record):
        from order.item_cancellations import Books
        books = Books.__new__(Books)
        books.post = Mock(return_value={'Id': 'receipt'})
        op = SimpleNamespace(order=SimpleNamespace(transaction_id='pi_example'),
                             accounting_payload={'Line': []}, key='key')
        books.record_refund(op)
        books.post.assert_called_once_with('refundreceipt', op.accounting_payload, op.key)
        record.assert_not_called()
