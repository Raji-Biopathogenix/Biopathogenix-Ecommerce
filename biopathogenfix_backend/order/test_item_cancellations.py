from copy import deepcopy
from decimal import Decimal
from unittest.mock import patch, Mock

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from order import item_cancellations as service
from order.models import Order, OrderItem, ItemCancellation
from order.packing_slips import packing_items
from order.views import CancelOrderItemView, RefundOrderView, CreateOutboundShipmentView


@override_settings(GRAPH_ENABLED=False, EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class ItemCancellationTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create(email='customer@example.com', is_active=True)
        self.admin = get_user_model().objects.create(email='staff@example.com', is_staff=True, is_active=True)
        self.order = Order.objects.create(user=self.user, transaction_id='pi_example', status='confirmed',
            paymet_status='success', payment_method='card', subtotal=Decimal('345.00'),
            coupon_amt=Decimal('34.50'), shipping_cost=Decimal('35.53'), tax_amount=Decimal('20.76'),
            amount=Decimal('366.79'), qb_invoice_id='invoice', qb_customer_id='customer', qb_realm_id='realm')
        self.items = [OrderItem.objects.create(order=self.order, product_name=name, sku_code=sku,
            quantity=1, unit_price=price, total=price) for name, sku, price in (
                ('Proteinase K', 'PROK', Decimal('60.00')),
                ('RNase P Verification Plate', 'EPCR-5', Decimal('250.00')),
                ('Proteinase K Buffer', 'BUFFER', Decimal('35.00')))]
        self.invoice = {'Id': 'invoice', 'SyncToken': '0', 'CustomerRef': {'value': 'customer'},
            'Balance': 0, 'TotalAmt': 366.79, 'ApplyTaxAfterDiscount': True,
            'LinkedTxn': [{'TxnType': 'Payment', 'TxnId': 'payment'}],
            'TxnTaxDetail': {'TotalTax': 20.76, 'TaxLine': [{'Amount': 20.76, 'DetailType': 'TaxLineDetail',
                'TaxLineDetail': {'TaxRateRef': {'value': 'tax'}, 'TaxPercent': 6, 'NetAmountTaxable': 346.03}}]},
            'Line': [{'Id': str(item.id), 'Amount': float(item.total), 'Description': 'SKU: ' + item.sku_code,
                      'DetailType': 'SalesItemLineDetail', 'SalesItemLineDetail': {'Qty': 1,
                      'ItemRef': {'value': str(item.id)}, 'TaxCodeRef': {'value': 'TAX'}}} for item in self.items]
                + [{'Amount': 345, 'DetailType': 'SubTotalLineDetail', 'SubTotalLineDetail': {}},
                   {'Amount': 34.50, 'DetailType': 'DiscountLineDetail', 'DiscountLineDetail': {'PercentBased': False}},
                   {'Id': 'shipping', 'Amount': 35.53, 'DetailType': 'SalesItemLineDetail',
                    'SalesItemLineDetail': {'ItemRef': {'value': 'SHIPPING_ITEM_ID'}, 'TaxCodeRef': {'value': 'TAX'}}}]}
        self.books = Mock()
        self.books.invoice.return_value = self.invoice
        self.books.get.return_value = {'DepositToAccountRef': {'value': 'bank'}}

    def prepare(self, item=None):
        item = item or self.items[0]
        quote = service.cancellation_quote(self.order, item)
        with patch.object(service, 'Books', return_value=self.books):
            return service.prepare(self.order.id, item.id, self.admin, 'Out of stock', quote['amount'])

    def test_allocations_refund_every_original_cent_once(self):
        quotes = [service.cancellation_quote(self.order, item) for item in self.items]
        self.assertEqual(quotes[0], {'subtotal': '60.00', 'discount': '6.00', 'shipping': '6.18', 'tax': '3.61', 'amount': '63.79'})
        for field, original in [('subtotal', self.order.subtotal), ('discount', self.order.coupon_amt),
                                ('shipping', self.order.shipping_cost), ('tax', self.order.tax_amount), ('amount', self.order.amount)]:
            self.assertEqual(sum(Decimal(row[field]) for row in quotes), original)
        for total in ('0', '.01', '.02', '1.00'):
            self.assertEqual(sum(service.allocate(total, {1: Decimal('1'), 2: Decimal('1'), 3: Decimal('1')}).values()), Decimal(total))

    def test_paid_preflight_keeps_shipping_and_product_separate(self):
        quote = service.cancellation_quote(self.order, self.items[0])
        paid, receipt = service.preflight(self.order, self.items[0], quote, self.books)
        self.assertTrue(paid)
        self.assertEqual(receipt['Line'][0]['Amount'], 54)
        self.assertEqual(receipt['Line'][1]['Amount'], 6.18)
        self.assertEqual(receipt['TxnTaxDetail']['TotalTax'], 3.61)
        self.assertEqual(receipt['DepositToAccountRef'], {'value': 'bank'})

    def test_unpaid_invoice_reduction_does_not_refund_card(self):
        self.order.payment_method = 'invoice'
        self.order.paymet_status = 'pending'
        self.order.save()
        self.invoice['Balance'] = 366.79
        op = self.prepare()
        self.assertFalse(op.paid)
        payload = op.accounting_payload
        self.assertEqual(payload['Line'][0]['Amount'], 0)
        self.assertEqual(payload['Line'][-1]['Amount'], 29.35)
        self.assertEqual(payload['Line'][-2]['Amount'], 28.5)
        self.assertEqual(payload['TxnTaxDetail']['TotalTax'], 17.15)
        self.books.post.return_value = {'Id': 'invoice', 'TotalAmt': 303.00}
        with patch.object(service, 'Books', return_value=self.books), patch.object(service, 'refund_stripe_payment') as refund:
            service.process(op)
            refund.assert_not_called()
        self.assertEqual(op.state, 'complete')

    def test_success_and_duplicate_request_issue_only_one_refund(self):
        op = self.prepare()
        self.books.post.side_effect = [{'Id': 'receipt', 'TotalAmt': 63.79}, self.invoice]
        with patch.object(service, 'Books', return_value=self.books), \
                patch.object(service, 'refund_stripe_payment', return_value={'id': 're_1', 'status': 'succeeded'}) as refund:
            service.process(op)
            duplicate = self.prepare()
            service.process(duplicate)
            self.assertEqual(refund.call_count, 1)
            self.assertEqual(refund.call_args.kwargs['idempotency_key'], str(op.key))
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'confirmed')
        self.assertEqual(self.order.amount, Decimal('366.79'))
        self.assertEqual(self.order.refund_amount, Decimal('63.79'))
        self.assertEqual(service.financial_summary(self.order)['remaining_total'], '303.00')
        self.assertEqual(len(packing_items(self.order)), 2)
        self.assertEqual(ItemCancellation.objects.count(), 1)
        self.assertEqual(op.state, 'complete')

    def test_timeout_is_not_automatically_refunded_again(self):
        op = self.prepare()
        with patch.object(service, 'Books', return_value=self.books), \
                patch.object(service, 'refund_stripe_payment', side_effect=TimeoutError) as refund, \
                self.assertLogs(service.logger, level='ERROR'):
            service.process(op)
            service.process(op)
        self.assertEqual(refund.call_count, 1)
        self.assertEqual(op.state, 'refund_submitting')
        self.assertTrue(op.error)

    def test_accounting_failure_keeps_refund_reference(self):
        op = self.prepare()
        self.books.post.side_effect = TimeoutError
        with patch.object(service, 'Books', return_value=self.books), \
                patch.object(service, 'refund_stripe_payment', return_value={'id': 're_1', 'status': 'succeeded'}) as refund, \
                self.assertLogs(service.logger, level='ERROR'):
            service.process(op)
            service.process(op)
        self.assertEqual(refund.call_count, 1)
        self.assertEqual(op.refund_id, 're_1')
        self.assertEqual(op.state, 'accounting_submitting')

    def test_pending_refund_is_not_confirmed_in_email(self):
        from django.core import mail
        op = self.prepare()
        with patch.object(service, 'Books', return_value=self.books), \
                patch.object(service, 'refund_stripe_payment', return_value={'id': 're_1', 'status': 'pending'}):
            service.process(op)
        self.books.post.assert_not_called()
        service.notify_customer(op)
        html = mail.outbox[0].alternatives[0].content
        self.assertIn('Refund awaiting confirmation', html)
        self.assertNotIn('Refund processed', html)
        self.assertIn('RNase P Verification Plate', html)
        self.assertIn('Only this item has been cancelled', html)
        self.assertNotIn('Order cancelled', html)
        self.assertEqual(op.state, 'refund_pending')

    def test_declined_refund_requires_review(self):
        op = self.prepare()
        with patch.object(service, 'Books', return_value=self.books), \
                patch.object(service, 'refund_stripe_payment', return_value={'id': 're_1', 'status': 'failed'}):
            service.process(op)
        self.assertEqual(op.state, 'review')
        self.books.post.assert_not_called()

    def test_mismatched_invoice_blocks_cancellation_before_money_moves(self):
        self.invoice['TotalAmt'] = 403.36
        with self.assertRaisesMessage(ValueError, 'totals differ'):
            self.prepare()
        self.assertFalse(ItemCancellation.objects.exists())
        self.items[0].refresh_from_db()
        self.assertFalse(self.items[0].is_cancelled)

    def test_wrong_preview_and_previous_refunds_are_rejected(self):
        with self.assertRaisesMessage(ValueError, 'preview'):
            service.prepare(self.order.id, self.items[0].id, self.admin, 'Reason', '1.00')
        self.order.refund_amount = 1
        self.order.save()
        with self.assertRaisesMessage(ValueError, 'other refunds'):
            self.prepare()

    def test_legacy_cancelled_item_can_be_reconciled_once(self):
        self.items[0].is_cancelled = True
        self.items[0].save()
        op = self.prepare()
        self.assertEqual(op.amount, Decimal('63.79'))
        self.assertEqual(self.prepare().pk, op.pk)

    def test_pending_operation_blocks_other_item_refund(self):
        self.prepare()
        with self.assertRaisesMessage(ValueError, 'pending cancellation'):
            self.prepare(self.items[1])

    def test_customer_cannot_cancel_or_preview(self):
        factory = APIRequestFactory()
        for method in ('get', 'post'):
            request = getattr(factory, method)('/cancel/', {})
            force_authenticate(request, user=self.user)
            response = CancelOrderItemView.as_view()(request, order_id=self.order.id, item_id=self.items[0].id)
            self.assertEqual(response.status_code, 403)

    def test_cancelled_item_cannot_be_shipped(self):
        self.prepare()
        request = APIRequestFactory().post('/ship/', {'item_ids': [self.items[0].id]}, format='json')
        force_authenticate(request, user=self.admin)
        with patch('order.views.ups.create_shipment') as ship:
            response = CreateOutboundShipmentView.as_view()(request, order_id=self.order.id)
            self.assertEqual(response.status_code, 400)
            ship.assert_not_called()

    def test_legacy_full_refund_is_blocked_after_item_refund(self):
        self.prepare()
        request = APIRequestFactory().post('/refund/', {'refund_amount': 366.79}, format='json')
        force_authenticate(request, user=self.admin)
        self.assertEqual(RefundOrderView.as_view()(request, order_id=self.order.id).status_code, 400)


    def test_all_three_refunds_equal_original_payment_and_empty_packing_slip(self):
        with patch.object(service, 'Books', return_value=self.books), \
                patch.object(service, 'refund_stripe_payment') as refund:
            for index, item in enumerate(self.items):
                op = self.prepare(item)
                refund.return_value = {'id': f're_{index}', 'status': 'succeeded'}
                self.books.post.side_effect = [{'Id': f'receipt{index}', 'TotalAmt': float(op.amount)}, self.invoice]
                service.process(op)
                self.assertEqual(op.state, 'complete')
            self.assertEqual(refund.call_count, 3)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'cancelled')
        self.assertEqual(self.order.refund_amount, self.order.amount)
        self.assertEqual(service.financial_summary(self.order)['remaining_total'], '0.00')
        self.assertEqual(packing_items(self.order), [])

    def test_pending_refund_refresh_completes_without_new_refund(self):
        op = self.prepare()
        self.books.post.side_effect = [{'Id': 'receipt', 'TotalAmt': 63.79}, self.invoice]
        with patch.object(service, 'Books', return_value=self.books), \
                patch.object(service, 'refund_stripe_payment', return_value={'id': 're_1', 'status': 'pending'}) as create, \
                patch.object(service, 'retrieve_refund', return_value={'id': 're_1', 'status': 'succeeded'}) as retrieve:
            service.process(op)
            service.notify_customer(op)
            self.assertTrue(op.email_sent)
            service.process(op)
            self.assertEqual(op.state, 'complete')
            self.assertFalse(op.email_sent)
            self.assertEqual(create.call_count, 1)
            retrieve.assert_called_once()

    def test_verified_accounting_receipt_resumes_without_refunding(self):
        op = self.prepare()
        op.state = 'accounting_submitting'
        op.refund_status = 'succeeded'
        op.refund_id = 're_1'
        op.save()
        self.books.get.return_value = {'Id': 'receipt', 'TotalAmt': 63.79,
            'CustomerRef': {'value': 'customer'}, 'PrivateNote': f'[Item cancellation {op.key}]'}
        self.books.post.return_value = self.invoice
        with patch.object(service, 'Books', return_value=self.books), patch.object(service, 'refund_stripe_payment') as refund:
            service.reconcile_existing(op, receipt_id='receipt')
            service.process(op)
            refund.assert_not_called()
        self.assertEqual(op.state, 'complete')
        self.assertEqual(self.books.post.call_args.args[0], 'invoice')

    def test_wrong_receipt_cannot_complete_operation(self):
        op = self.prepare()
        op.state = 'accounting_submitting'
        self.books.get.return_value = {'Id': 'receipt', 'TotalAmt': 63.79,
            'CustomerRef': {'value': 'different'}, 'PrivateNote': f'[Item cancellation {op.key}]'}
        with patch.object(service, 'Books', return_value=self.books), self.assertRaises(ValueError):
            service.reconcile_existing(op, receipt_id='receipt')

    def test_quickbooks_refund_uses_persisted_request_id(self):
        self.order.transaction_id = 'qb-charge'
        self.order.save()
        op = self.prepare()
        self.books.post.side_effect = [{'Id': 'receipt', 'TotalAmt': 63.79}, self.invoice]
        with patch.object(service, 'Books', return_value=self.books), \
                patch.object(service, 'refund_qb_charge', return_value={'id': 'qb-refund', 'status': 'ISSUED'}) as refund:
            service.process(op)
        self.assertEqual(op.state, 'complete')
        self.assertEqual(refund.call_args.kwargs['request_id'], str(op.key))

    def test_api_confirmation_uses_server_amount(self):
        request = APIRequestFactory().post('/cancel/', {'cancel_notes': 'Out of stock', 'expected_amount': '1.00'}, format='json')
        force_authenticate(request, user=self.admin)
        with patch.object(service, 'refund_stripe_payment') as refund:
            result = CancelOrderItemView.as_view()(request, order_id=self.order.id, item_id=self.items[0].id)
        self.assertEqual(result.status_code, 400)
        refund.assert_not_called()
