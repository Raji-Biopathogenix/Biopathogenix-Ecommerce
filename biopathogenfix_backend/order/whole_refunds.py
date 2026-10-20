"""Durable Intuit refunds. Accounting retries never submit another refund."""
from decimal import Decimal
from urllib.parse import quote

import requests
from django.db import transaction
from django.utils import timezone

from payments.models import QBConfig
from payments.utils import (create_qb_refund_receipt, get_valid_qb_token,
                            get_qb_base_url, refund_qb_charge)
from .models import Order, OrderRefund
from .email_service import send_refund_email


@transaction.atomic
def prepare(order_id, amount, actor, notes='', staff_reference=''):
    order = Order.objects.select_for_update().get(pk=order_id)
    existing = OrderRefund.objects.filter(order=order).first()
    if existing:
        if existing.amount != amount:
            raise ValueError('A refund already exists for this order with a different amount.')
        return existing
    if order.item_cancellations.exists() or not order.is_refundable:
        raise ValueError('This order is not eligible for a whole-order refund.')
    if amount <= 0 or amount > order.amount:
        raise ValueError('Refund amount must be positive and cannot exceed the order total.')
    config = QBConfig.get()
    if (not order.transaction_id or str(order.transaction_id).startswith('pi_')
            or not order.qb_invoice_id or not order.qb_customer_id
            or str(config.realm_id) != order.qb_realm_id):
        raise ValueError('Verified original QuickBooks invoice, customer and charge references are required.')
    return OrderRefund.objects.create(order=order, amount=amount, created_by=actor,
        charge_id=order.transaction_id, realm_id=order.qb_realm_id,
        customer_id=order.qb_customer_id, invoice_id=order.qb_invoice_id,
        notes=notes, staff_reference=staff_reference)


def _save_response(refund, response):
    if not response.get('id'):
        raise ValueError('The provider refund reference is missing.')
    status = str(response.get('status', '')).lower()
    refund.refund_id = str(response['id'])
    refund.refund_status = status
    refund.state = ('accounting_pending' if status == 'issued' else
                    'failed' if status in ('declined', 'failed', 'canceled', 'cancelled')
                    else 'provider_pending')
    refund.error = ''
    refund.save(update_fields=['refund_id', 'refund_status', 'state', 'error', 'updated_at'])
    values = {'refund_status': status, 'refund_notes': refund.notes,
              'refund_reference': refund.staff_reference or refund.refund_id}
    if status == 'issued':
        partial = refund.amount < refund.order.amount
        values.update(refund_amount=refund.amount, refunded_at=timezone.now(),
                      refunded_by=refund.created_by, is_partially_refunded=partial,
                      status='partially_refunded' if partial else 'refunded')
    # Keep pending/failed provider operations out of completed-refund amounts.
    Order.objects.filter(pk=refund.order_id).update(**values)
    if status == 'issued' and not refund.email_sent:
        transaction.on_commit(lambda: _send_confirmation(refund.pk))


def _send_confirmation(refund_id):
    refund = OrderRefund.objects.select_related('order', 'created_by').get(pk=refund_id)
    if refund.email_sent:
        return
    data = {'status': refund.order.status, 'refund_status': refund.refund_status,
            'refund_amount': str(refund.amount), 'refunded_at': refund.order.refunded_at,
            'qb_refund_id': refund.refund_id, 'qb_status': refund.refund_status.upper(),
            'refunded_by': refund.created_by.email}
    if send_refund_email(refund.order, data):
        OrderRefund.objects.filter(pk=refund_id).update(email_sent=True)


def _provider_refund(refund, token, config):
    response = requests.get(
        f'{get_qb_base_url(config)}/quickbooks/v4/payments/charges/'
        f'{quote(refund.charge_id, safe="")}/refunds/{quote(refund.refund_id, safe="")}',
        headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'}, timeout=20)
    response.raise_for_status()
    data = response.json()
    if (str(data.get('id')) != refund.refund_id
            or Decimal(str(data.get('amount'))) != refund.amount):
        raise ValueError('Provider refund identity or amount does not match.')
    return data


def process(refund_id):
    """Persist intent before external money movement; recover accounting by ID."""
    refund = OrderRefund.objects.get(pk=refund_id)
    if refund.state in ('complete', 'failed', 'review', 'submitting'):
        return refund
    try:
        config = QBConfig.get()
        if str(config.realm_id) != refund.realm_id:
            raise ValueError('The connected QuickBooks company has changed.')
        token = get_valid_qb_token()
        if refund.state == 'ready':
            # This commit occurs before the provider request. A crash/timeout
            # leaves submitting/review; never automatically move money again.
            claimed = OrderRefund.objects.filter(pk=refund.pk, state='ready').update(state='submitting')
            if not claimed:
                refund.refresh_from_db()
                return refund
            refund.state = 'submitting'
            response = refund_qb_charge(token, refund.charge_id, refund.amount,
                description=refund.notes or f'Refund for Order #{refund.order_id}',
                request_id=str(refund.key))
            with transaction.atomic():
                refund = OrderRefund.objects.select_for_update().get(pk=refund.pk)
                _save_response(refund, response)
        elif refund.state == 'provider_pending':
            response = _provider_refund(refund, token, config)
            with transaction.atomic():
                refund = OrderRefund.objects.select_for_update().get(pk=refund.pk)
                # Another worker may already have completed the accounting.
                if refund.state == 'provider_pending':
                    _save_response(refund, response)
        if refund.state == 'accounting_pending':
            with transaction.atomic():
                refund = OrderRefund.objects.select_for_update().get(pk=refund.pk)
                if refund.state != 'accounting_pending':
                    return refund
                try:
                    receipt = create_qb_refund_receipt(token, refund.customer_id, refund.amount,
                        refund.notes or f'Refund for Order #{refund.order_id}',
                        charge_id=refund.charge_id, refund_id=refund.refund_id,
                        invoice_id=refund.invoice_id, recoverable=True)
                    if not receipt.get('Id'):
                        raise ValueError('QuickBooks did not confirm the refund receipt.')
                    refund.accounting_id = str(receipt['Id'])
                    refund.state = 'complete'
                    refund.error = ''
                except Exception:
                    refund.error = 'Refund issued; QuickBooks accounting is pending automatic retry.'
                refund.save(update_fields=['accounting_id', 'state', 'error', 'updated_at'])
    except Exception:
        # Serialize failure updates too, so a stale worker cannot overwrite a
        # receipt confirmation committed by another worker.
        with transaction.atomic():
            refund = OrderRefund.objects.select_for_update().get(pk=refund.pk)
            if refund.state == 'submitting':
                refund.state = 'review'
                refund.error = 'Refund outcome is unconfirmed. Verify the provider reference before recovery; do not issue another refund.'
            elif refund.state not in ('complete', 'failed'):
                refund.error = 'Refund confirmation or accounting is pending. Check the connection and saved references.'
            refund.save(update_fields=['state', 'error', 'updated_at'])
    return refund


def summary(refund):
    order = Order.objects.get(pk=refund.order_id)
    return {'status': order.status,
            'refunded_at': order.refunded_at.isoformat() if order.refunded_at else '',
            'refund_accounting_state': refund.state,
            'refund_accounting_pending': refund.state not in ('complete', 'failed'),
            'qb_refund_id': refund.refund_id, 'qb_refund_receipt_id': refund.accounting_id,
            'refund_status': refund.refund_status, 'refund_amount': str(refund.amount),
            'refund_accounting_error': refund.error}


@transaction.atomic
def recover(refund_id, provider_id):
    """Attach a verified provider refund after an uncertain submission; never refund money."""
    refund = OrderRefund.objects.select_for_update().get(pk=refund_id)
    if refund.state == 'complete':
        return refund
    if not provider_id or (refund.refund_id and refund.refund_id != provider_id):
        raise ValueError('The provider refund reference conflicts with the saved refund.')
    config = QBConfig.get()
    if str(config.realm_id) != refund.realm_id:
        raise ValueError('The connected QuickBooks company has changed.')
    refund.refund_id = provider_id
    response = _provider_refund(refund, get_valid_qb_token(), config)
    _save_response(refund, response)
    return refund
