"""Item cancellation with frozen allocations and separately persisted refund/accounting steps."""
from copy import deepcopy
from decimal import Decimal, ROUND_DOWN, ROUND_HALF_UP
import logging

import requests
from django.db import transaction
from django.utils import timezone
from payments.models import QBConfig
from payments.utils import get_valid_qb_token, get_qb_accounting_base_url, refund_qb_charge
from payments.stripe_utils import refund_stripe_payment, get_stripe_client
from .models import Order, OrderItem, ItemCancellation

logger = logging.getLogger(__name__)
CENT = Decimal('0.01')


def money(value):
    return Decimal(str(value or 0)).quantize(CENT, rounding=ROUND_HALF_UP)


def allocate(amount, weights):
    """Largest remainder allocation: every original cent belongs to exactly one item."""
    amount = money(amount)
    total = sum(weights.values())
    if total <= 0:
        if amount:
            raise ValueError('Cannot allocate this order: product subtotal is zero.')
        return {key: Decimal('0.00') for key in weights}
    raw = {key: amount * weight / total for key, weight in weights.items()}
    result = {key: value.quantize(CENT, rounding=ROUND_DOWN) for key, value in raw.items()}
    cents = int((amount - sum(result.values())) / CENT)
    for key in sorted(weights, key=lambda key: (-(raw[key] - result[key]), key))[:cents]:
        result[key] += CENT
    return result


def cancellation_quote(order, item):
    items = list(order.items.all())
    weights = {row.id: money(row.total) for row in items}
    if money(sum(weights.values())) != money(order.subtotal):
        raise ValueError('Order item totals do not match the saved subtotal. Reconcile the order first.')
    if money(order.subtotal - order.coupon_amt + order.shipping_cost + order.tax_amount) != money(order.amount):
        raise ValueError('Saved order totals do not reconcile. Review the order before refunding.')
    discount = allocate(order.coupon_amt, weights)[item.id]
    shipping = allocate(order.shipping_cost, weights)[item.id]
    tax = allocate(order.tax_amount, weights)[item.id]
    subtotal = weights[item.id]
    amount = subtotal - discount + shipping + tax
    return {key: str(money(value)) for key, value in dict(
        subtotal=subtotal, discount=discount, shipping=shipping, tax=tax, amount=amount,
    ).items()}


def financial_summary(order):
    operations = list(order.item_cancellations.all())
    cancelled = sum((op.amount for op in operations), Decimal('0'))
    refunded = sum((op.amount for op in operations if op.refund_status in ('succeeded', 'issued')), Decimal('0'))
    return {
        'cancelled_amount': str(money(cancelled)),
        'refunded_amount': str(money(refunded)),
        'remaining_total': str(money(order.amount - cancelled)),
        'refund_pending': any(op.paid and op.refund_status not in ('succeeded', 'issued') for op in operations),
        'accounting_pending': any(op.state != 'complete' for op in operations),
        'adjustments': [dict(item_id=op.item_id, amount=str(op.amount), state=op.state,
                             refund_status=op.refund_status, receipt_id=op.accounting_id if op.paid else '')
                        for op in operations],
    }


class Books:
    def __init__(self, order):
        config = QBConfig.get()
        if not order.qb_invoice_id or not order.qb_customer_id or str(config.realm_id) != order.qb_realm_id:
            raise ValueError('A matching linked QuickBooks invoice is required before cancelling an item.')
        self.order = order
        self.token = get_valid_qb_token()
        self.base = f'{get_qb_accounting_base_url(config)}/v3/company/{order.qb_realm_id}'
        self.headers = {'Authorization': f'Bearer {self.token}', 'Accept': 'application/json'}

    def get(self, entity, identifier):
        response = requests.get(f'{self.base}/{entity}/{identifier}', headers=self.headers, timeout=20)
        response.raise_for_status()
        return response.json()[entity.capitalize() if entity != 'refundreceipt' else 'RefundReceipt']

    def invoice(self):
        invoice = self.get('invoice', self.order.qb_invoice_id)
        if (str(invoice.get('Id')) != self.order.qb_invoice_id or
                str(invoice.get('CustomerRef', {}).get('value')) != self.order.qb_customer_id):
            raise ValueError('QuickBooks invoice does not belong to this order.')
        return invoice

    def post(self, entity, payload, key):
        response = requests.post(f'{self.base}/{entity}', headers=self.headers,
                                 params={'requestid': str(key)}, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        name = 'RefundReceipt' if entity == 'refundreceipt' else 'Invoice'
        if not data.get(name, {}).get('Id'):
            raise ValueError('QuickBooks did not confirm the accounting update.')
        return data[name]


def preflight(order, item, breakdown, books):
    invoice = books.invoice()
    summary = financial_summary(order)
    # Paid invoices retain original sale/payment; unpaid ones have their balance reduced.
    balance = money(invoice['Balance'])
    paid = balance == 0 and money(invoice['TotalAmt']) > 0
    if not paid and balance != money(invoice['TotalAmt']):
        raise ValueError('This invoice is partially paid. Reconcile its payment before item cancellation.')
    expected = money(order.amount) if paid else money(summary['remaining_total'])
    if money(invoice['TotalAmt']) != expected:
        raise ValueError('Invoice and order totals differ. Reconcile the existing invoice before refunding.')
    if order.paymet_status == 'success' and not paid:
        raise ValueError('Payment has not been reconciled to the invoice. Reconcile it before cancellation.')
    if paid and (order.payment_method != 'card' or not order.transaction_id or order.paymet_status != 'success'):
        raise ValueError('This paid invoice needs its original card payment reference before automatic refund.')
    lines = invoice.get('Line', [])
    product_tax_codes = {line.get('SalesItemLineDetail', {}).get('TaxCodeRef', {}).get('value')
                         for line in lines if line.get('DetailType') == 'SalesItemLineDetail'
                         and line.get('SalesItemLineDetail', {}).get('ItemRef', {}).get('value') != 'SHIPPING_ITEM_ID'
                         and money(line.get('Amount')) > 0}
    if len(product_tax_codes) > 1:
        raise ValueError('Invoice items have mixed tax treatment. Review item tax allocation before refunding.')
    matches = [line for line in lines if line.get('DetailType') == 'SalesItemLineDetail'
               and f'SKU: {item.sku_code}' in line.get('Description', '').splitlines()]
    if len(matches) != 1 or money(matches[0]['Amount']) != money(item.total):
        raise ValueError('Cannot uniquely match this item to its QuickBooks invoice line.')
    original = matches[0]
    amount = money(breakdown['amount'])
    tax = money(breakdown['tax'])
    tax_detail = deepcopy(invoice.get('TxnTaxDetail', {}))
    original_tax = money(tax_detail.get('TotalTax'))
    tax_lines = tax_detail.get('TaxLine', [])
    if tax and (not tax_lines or not original_tax):
        raise ValueError('Invoice tax details are missing. Review the item tax before refunding.')
    allocated_taxes = allocate(tax, {i: money(line['Amount']) for i, line in enumerate(tax_lines)}) if tax_lines else {}
    for i, line in enumerate(tax_lines):
        line.pop('Id', None)
        old_amount = money(line['Amount'])
        line['Amount'] = float(allocated_taxes[i] if paid else old_amount - allocated_taxes[i])
        detail = line.get('TaxLineDetail', {})
        if 'NetAmountTaxable' in detail and old_amount:
            old_base = Decimal(str(detail['NetAmountTaxable']))
            share = old_base * allocated_taxes[i] / old_amount
            detail['NetAmountTaxable'] = float(money(share if paid else old_base - share))
    tax_detail['TotalTax'] = float(tax if paid else original_tax - tax)

    note = f'ORD-{order.id:06d}: cancelled {item.product_name}; SKU: {item.sku_code}; quantity {item.quantity}'
    if paid:
        payments = [row for row in invoice.get('LinkedTxn', []) if row.get('TxnType') == 'Payment']
        if len(payments) != 1:
            raise ValueError('Expected one linked payment. Review invoice payment allocation before refunding.')
        payment = books.get('payment', payments[0]['TxnId'])
        account = payment.get('DepositToAccountRef')
        if not account:
            raise ValueError('The payment deposit account is missing in QuickBooks.')
        detail = deepcopy(original['SalesItemLineDetail'])
        product_net = money(breakdown['subtotal']) - money(breakdown['discount'])
        detail.update(Qty=item.quantity, UnitPrice=float(product_net / item.quantity))
        detail.pop('ServiceDate', None)
        receipt = {'CustomerRef': invoice['CustomerRef'], 'DepositToAccountRef': account,
                   'PrivateNote': note, 'CustomerMemo': {'value': note},
                   'Line': [{'Amount': float(product_net), 'Description': note + '; after allocated coupon',
                             'DetailType': 'SalesItemLineDetail', 'SalesItemLineDetail': detail}],
                   'TxnTaxDetail': tax_detail}
        if money(breakdown['shipping']):
            shipping_lines = [row for row in lines if row.get('SalesItemLineDetail', {}).get('ItemRef', {}).get('value') == 'SHIPPING_ITEM_ID']
            if len(shipping_lines) != 1:
                raise ValueError('Cannot match the original shipping charge in QuickBooks.')
            shipping_detail = deepcopy(shipping_lines[0]['SalesItemLineDetail'])
            shipping_detail.update(Qty=1, UnitPrice=float(money(breakdown['shipping'])))
            receipt['Line'].append({'Amount': float(money(breakdown['shipping'])),
                'Description': 'Allocated shipping refund', 'DetailType': 'SalesItemLineDetail',
                'SalesItemLineDetail': shipping_detail})
        for field in ('BillAddr', 'ShipAddr', 'CurrencyRef'):
            if field in invoice:
                receipt[field] = invoice[field]
        return paid, receipt

    revised = []
    for line in deepcopy(lines):
        if line.get('Id') == original.get('Id') and line.get('DetailType') == 'SalesItemLineDetail':
            # Leave a zero line if this is the final item: QBO requires a sales line.
            line['Amount'] = 0
            line['Description'] = 'CANCELLED: ' + line.get('Description', '')
            line['SalesItemLineDetail'].update(Qty=0, UnitPrice=0)
        elif line.get('DetailType') == 'SubTotalLineDetail':
            line['Amount'] = float(money(line['Amount']) - money(breakdown['subtotal']))
        elif line.get('DetailType') == 'DiscountLineDetail':
            line['Amount'] = float(money(line['Amount']) - money(breakdown['discount']))
            line['DiscountLineDetail']['PercentBased'] = False
            line['DiscountLineDetail'].pop('DiscountPercent', None)
        elif line.get('SalesItemLineDetail', {}).get('ItemRef', {}).get('value') == 'SHIPPING_ITEM_ID':
            line['Amount'] = float(money(line['Amount']) - money(breakdown['shipping']))
            line['SalesItemLineDetail'].update(Qty=1, UnitPrice=line['Amount'])
        revised.append(line)
    return paid, {'Id': invoice['Id'], 'SyncToken': invoice['SyncToken'], 'sparse': True,
                  'Line': revised, 'TxnTaxDetail': tax_detail,
                  'CustomerMemo': {'value': invoice.get('CustomerMemo', {}).get('value', '') + '\n' + note}}


def prepare(order_id, item_id, user, notes, expected_amount):
    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order_id)
        item = OrderItem.objects.select_for_update().get(pk=item_id, order=order)
        existing = ItemCancellation.objects.filter(item=item).first()
        if existing:
            return existing
        if item.status or item.is_returned or item.return_status != 'none':
            raise ValueError('Only unshipped items without an active return can be cancelled.')
        if order.item_cancellations.exclude(state='complete').exists():
            raise ValueError('Resolve the pending cancellation on this order before cancelling another item.')
        tracked_refunds = sum((op.amount for op in order.item_cancellations.all()
                               if op.refund_status in ('succeeded', 'issued')), Decimal('0'))
        if money(order.refund_amount) != money(tracked_refunds):
            raise ValueError('This order has other refunds. Reconcile them before cancelling an item.')
        breakdown = cancellation_quote(order, item)
        if expected_amount is None or money(expected_amount) != money(breakdown['amount']):
            raise ValueError('Refresh the cancellation preview and confirm the updated amount.')
        paid, payload = preflight(order, item, breakdown, Books(order))
        op = ItemCancellation.objects.create(order=order, item=item, created_by=user,
            amount=money(breakdown['amount']), breakdown=breakdown, paid=paid, accounting_payload=payload,
            notes=notes)
        marker = f'[Item cancellation {op.key}]'
        if paid:
            op.accounting_payload['DocNumber'] = 'IC' + op.key.hex[:18]
            op.accounting_payload['PrivateNote'] += ' ' + marker
        else:
            op.accounting_payload['CustomerMemo']['value'] += ' ' + marker
        op.save(update_fields=['accounting_payload'])
        item.is_cancelled = True
        item.cancel_notes = notes
        item.cancelled_at = timezone.now()
        item.cancelled_by = user
        item.save(update_fields=['is_cancelled', 'cancel_notes', 'cancelled_at', 'cancelled_by'])
        if not order.items.filter(is_cancelled=False).exists():
            # Queryset update avoids sending a generic whole-order status email.
            Order.objects.filter(pk=order.pk).update(status='cancelled')
        return op


def record_refund(op, refund):
    status = str(refund.get('status', '')).lower()
    if not refund.get('id'):
        raise ValueError('Payment provider returned no refund reference. Reconciliation required.')
    was_confirmed = op.refund_status in ('issued', 'succeeded')
    op.refund_id = str(refund['id'])
    op.refund_status = status
    op.state = 'accounting_pending' if status in ('issued', 'succeeded') else 'refund_pending'
    if status in ('failed', 'declined', 'canceled', 'cancelled'):
        op.state = 'review'
    if not was_confirmed and status in ('issued', 'succeeded'):
        op.email_sent = False
    op.save(update_fields=['refund_id', 'refund_status', 'state', 'email_sent', 'updated_at'])
    if op.state == 'accounting_pending':
        confirmed = sum((row.amount for row in op.order.item_cancellations.all()
                         if row.refund_status in ('issued', 'succeeded')), Decimal('0'))
        Order.objects.filter(pk=op.order_id).update(refund_amount=confirmed,
            refund_status=status, refunded_at=timezone.now(), refunded_by=op.created_by,
            refund_reference=op.refund_id, is_partially_refunded=confirmed < op.order.amount)


def retrieve_refund(op, books, refund_id):
    if op.order.transaction_id.startswith('pi_'):
        refund = get_stripe_client().refunds.retrieve(refund_id)
        if str(refund.payment_intent) != op.order.transaction_id or money(Decimal(refund.amount) / 100) != op.amount:
            raise ValueError('Refund does not match this original payment and item amount.')
        return {'id': refund.id, 'status': refund.status}
    from payments.utils import get_qb_base_url
    config = QBConfig.get()
    response = requests.get(
        f'{get_qb_base_url(config)}/quickbooks/v4/payments/charges/{op.order.transaction_id}/refunds/{refund_id}',
        headers={**books.headers, 'Company-Id': op.order.qb_realm_id}, timeout=20)
    response.raise_for_status()
    refund = response.json()
    if str(refund.get('id')) != refund_id or money(refund.get('amount')) != op.amount:
        raise ValueError('Refund does not match this original payment and item amount.')
    return refund


def reconcile_existing(op, refund_id='', receipt_id=''):
    """Verify externally completed steps; never create another refund on reconciliation."""
    books = Books(op.order)
    if refund_id:
        if not op.paid or (op.refund_id and op.refund_id != refund_id):
            raise ValueError('Refund reference conflicts with the saved cancellation.')
        refund = retrieve_refund(op, books, refund_id)
        if op.refund_status not in ('issued', 'succeeded'):
            record_refund(op, refund)
    if op.state == 'accounting_submitting' or receipt_id:
        if op.paid:
            identifier = receipt_id or op.accounting_id
            if not identifier:
                raise ValueError('Supply the existing QuickBooks refund receipt ID after reviewing the accounting record.')
            receipt = books.get('refundreceipt', identifier)
            marker = f'[Item cancellation {op.key}]'
            if (money(receipt.get('TotalAmt')) != op.amount or
                    str(receipt.get('CustomerRef', {}).get('value')) != op.order.qb_customer_id or
                    marker not in receipt.get('PrivateNote', '')):
                raise ValueError('Receipt amount, customer, or cancellation reference does not match.')
            if op.refund_status not in ('issued', 'succeeded', 'not_required'):
                raise ValueError('Confirm the actual card refund before completing accounting reconciliation.')
            op.accounting_id = str(receipt['Id'])
            op.state = 'accounting_pending'
        else:
            invoice = books.invoice()
            if (f'[Item cancellation {op.key}]' not in invoice.get('CustomerMemo', {}).get('value', '') or
                    money(invoice['TotalAmt']) != money(financial_summary(op.order)['remaining_total'])):
                raise ValueError('Invoice adjustment is not confirmed in QuickBooks.')
            op.accounting_id = str(invoice['Id'])
            op.state = 'complete'
        op.error = ''
        op.save(update_fields=['accounting_id', 'state', 'error', 'updated_at'])
    return op


def process(op):
    """A saved submitting state is never automatically resubmitted after a timeout."""
    if op.state in ('complete', 'review', 'refund_submitting', 'accounting_submitting'):
        return op
    try:
        books = Books(op.order)
        if op.state == 'ready':
            if not ItemCancellation.objects.filter(pk=op.pk, state='ready').update(state='refund_submitting'):
                op.refresh_from_db()
                return op
            op.state = 'refund_submitting'
            if op.paid and op.amount > 0:
                if op.order.transaction_id.startswith('pi_'):
                    refund = refund_stripe_payment(op.order.transaction_id, op.amount, idempotency_key=str(op.key))
                else:
                    refund = refund_qb_charge(books.token, op.order.transaction_id, op.amount,
                                             description=f'Item cancellation ORD-{op.order_id:06d} / {op.item_id}',
                                             request_id=str(op.key))
                record_refund(op, refund)
            else:
                op.refund_status = 'not_required'
                op.state = 'accounting_pending'
                op.save(update_fields=['refund_status', 'state', 'updated_at'])
        elif op.state == 'refund_pending':
            record_refund(op, retrieve_refund(op, books, op.refund_id))
        if op.state == 'accounting_pending':
            if not ItemCancellation.objects.filter(pk=op.pk, state='accounting_pending').update(state='accounting_submitting'):
                op.refresh_from_db()
                return op
            op.state = 'accounting_submitting'
            if not op.accounting_id:
                result = books.post('refundreceipt' if op.paid else 'invoice', op.accounting_payload, op.key)
                op.accounting_id = str(result['Id'])
                op.save(update_fields=['accounting_id', 'updated_at'])
                expected = op.amount if op.paid else money(financial_summary(op.order)['remaining_total'])
                if money(result['TotalAmt']) != expected:
                    raise ValueError('QuickBooks returned a different total; accounting review is required.')
            if op.paid:
                invoice = books.invoice()
                marker = f'[Item cancellation {op.key}]'
                memo = invoice.get('CustomerMemo', {}).get('value', '')
                if marker not in memo:
                    summary = financial_summary(op.order)
                    memo += (f'\n{marker} {op.item.product_name} (SKU {op.item.sku_code}), quantity {op.item.quantity}: '
                             f'refund ${op.amount}; receipt {op.accounting_id}. '
                             f'Remaining order value ${summary["remaining_total"]}. Original payment retained in history.')
                    books.post('invoice', {'Id': invoice['Id'], 'SyncToken': invoice['SyncToken'],
                               'sparse': True, 'CustomerMemo': {'value': memo}}, f'{op.key}-memo')
            op.state = 'complete'
            op.error = ''
            op.save(update_fields=['state', 'error', 'updated_at'])
    except Exception:
        logger.exception('Item cancellation %s requires reconciliation', op.pk)
        # Provider timeouts may occur after a refund succeeds. Never retry money movement blindly.
        op.error = 'The cancellation is recorded. Refund or accounting confirmation requires review; do not issue another refund.'
        op.save(update_fields=['error', 'updated_at'])
    return op


def notify_customer(op):
    if op.email_sent:
        return
    from django.conf import settings
    from django.template.loader import render_to_string
    from config.settings import configSettings
    from .email_service import _send_confirmation_message, _get_order_recipients, _order_logo_url
    summary = financial_summary(op.order)
    remaining_items = list(op.order.items.filter(is_cancelled=False))
    confirmed = op.refund_status in ('issued', 'succeeded')
    context = dict(logo_url=_order_logo_url(), order_number=f'ORD-{op.order_id:06d}',
        customer_name=op.order.fullName or 'Valued Customer', cancelled_at=op.item.cancelled_at,
        item=op.item, breakdown=op.breakdown, refund_confirmed=confirmed, paid=op.paid,
        remaining_items=remaining_items, remaining_total=summary['remaining_total'], cancel_notes=op.notes,
        order_url=f"{configSettings.FRONTEND_URL}/my-account/", support_email='order@biopathogenix.com',
        company_name='BioPathogenix', company_address=settings.PACKING_SLIP_COMPANY_ADDRESS)
    payment_message = (f'Refund processed: ${op.amount}.' if confirmed else
                       f'Refund pending confirmation: ${op.amount}.' if op.paid else
                       f'Invoice reduction: ${op.amount}.')
    text = (f'Item cancelled from ORD-{op.order_id:06d}: {op.item.product_name} '
            f'(SKU {op.item.sku_code}), quantity {op.item.quantity}.\n{payment_message}\n'
            f'Remaining order value: ${summary["remaining_total"]}.\n'
            + ('The remaining items are still active.' if remaining_items else 'No items remain to be shipped.'))
    try:
        _send_confirmation_message(to=_get_order_recipients(op.order), bcc=[],
            subject=f'Item cancellation - ORD-{op.order_id:06d}',
            html=render_to_string('order/item_cancellation_email.html', context), text=text)
        op.email_sent = True
        op.save(update_fields=['email_sent'])
    except Exception:
        logger.exception('Item cancellation notification failed for %s', op.pk)
