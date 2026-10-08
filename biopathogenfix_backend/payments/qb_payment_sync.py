"""Record captured Intuit charges without charging cards or inventing deposits."""
import uuid
from decimal import Decimal, InvalidOperation
from urllib.parse import quote

import requests


def _money(value):
    try:
        amount = Decimal(str(value))
        if not amount.is_finite() or amount != amount.quantize(Decimal('0.01')):
            raise ValueError('Invalid payment amount.')
        return amount
    except (InvalidOperation, TypeError):
        raise ValueError('Invalid payment amount.') from None


def record_captured_payment(token, realm_id, accounting_url, payments_url,
                            customer_id, invoice_id, amount, charge_id):
    """Return the linked Payment; fail closed if existing books disagree.

    PaymentRefNum allows lookup after a timeout. requestid also makes concurrent
    submissions of the same charge idempotent at Intuit. CreditChargeResponse
    carries the processor identity used by the merchant deposit workflow.
    """
    if not charge_id or str(charge_id).startswith(('pi_', 'INV-')):
        raise ValueError('A captured Intuit charge is required for payment synchronization.')
    amount = _money(amount)
    if amount <= 0:
        raise ValueError('Payment amount must be positive.')
    headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
    company_url = f'{accounting_url}/v3/company/{quote(str(realm_id), safe="")}'
    response = requests.get(
        f'{payments_url}/quickbooks/v4/payments/charges/{quote(str(charge_id), safe="")}',
        headers=headers, timeout=15,
    )
    response.raise_for_status()
    charge = response.json()
    if (str(charge.get('id')) != str(charge_id) or charge.get('status') != 'CAPTURED'
            or charge.get('currency') != 'USD' or _money(charge.get('amount')) != amount):
        raise ValueError('Captured charge does not match the payment. Accounting review required.')

    # Never use unescaped values in the QBO query language.
    reference = str(charge_id).replace('\\', '\\\\').replace("'", "\\'")
    response = requests.get(company_url + '/query', headers=headers,
        params={'query': f"SELECT * FROM Payment WHERE PaymentRefNum = '{reference}'"}, timeout=15)
    response.raise_for_status()
    result = response.json()
    if 'QueryResponse' not in result or 'Fault' in result:
        raise ValueError('Unable to check existing QuickBooks payments.')
    payments = result['QueryResponse'].get('Payment', [])
    if payments:
        if len(payments) != 1:
            raise ValueError('Duplicate payment references require accounting review.')
        payment = payments[0]
        _validate_payment(payment, customer_id, invoice_id, amount, charge_id)
        return payment

    response = requests.get(company_url + '/invoice/' + quote(str(invoice_id), safe=''),
                            headers=headers, timeout=15)
    response.raise_for_status()
    invoice = response.json().get('Invoice', {})
    if (str(invoice.get('Id')) != str(invoice_id)
            or str(invoice.get('CustomerRef', {}).get('value')) != str(customer_id)
            or invoice.get('CurrencyRef', {}).get('value', 'USD') != 'USD'
            or _money(invoice.get('Balance')) < amount):
        raise ValueError('Invoice identity or remaining balance does not match. Accounting review required.')

    charge_response = {'CCTransId': str(charge_id), 'Status': 'Completed'}
    if charge.get('authCode'):
        charge_response['AuthCode'] = charge['authCode']
    if charge.get('created'):
        charge_response['TxnAuthorizationTime'] = charge['created']
    context = charge.get('context') or {}
    for source, target in (('clientTransID', 'ClientTransID'), ('reconBatchID', 'ReconBatchId')):
        if context.get(source):
            charge_response[target] = context[source]
    payload = {
        'TotalAmt': float(amount), 'CustomerRef': {'value': str(customer_id)},
        'PaymentRefNum': str(charge_id), 'ProcessPayment': False,
        # Omitting DepositToAccountRef uses QBO's Undeposited Funds account.
        # Intuit records the actual settlement/fees using company deposit settings.
        'CreditCardPayment': {'CreditChargeResponse': charge_response},
        'PrivateNote': f'QB Payments Transaction ID: {charge_id}; Invoice ID: {invoice_id}',
        'Line': [{'Amount': float(amount), 'LinkedTxn': [
            {'TxnId': str(invoice_id), 'TxnType': 'Invoice'}]}],
    }
    if charge.get('created'):
        payload['TxnDate'] = charge['created'][:10]
    response = requests.post(company_url + '/payment',
        headers={**headers, 'Content-Type': 'application/json'},
        params={'requestid': str(uuid.uuid5(uuid.NAMESPACE_URL, f'qb-payment:{realm_id}:{charge_id}'))},
        json=payload, timeout=15)
    response.raise_for_status()
    result = response.json()
    if 'Fault' in result:
        raise ValueError('QuickBooks rejected the payment record; synchronization remains pending.')
    payment = result.get('Payment', {})
    _validate_payment(payment, customer_id, invoice_id, amount, charge_id)
    return payment


def _validate_payment(payment, customer_id, invoice_id, amount, charge_id):
    lines = payment.get('Line', [])
    linked_amount = sum((_money(line.get('Amount')) for line in lines
        if any(str(link.get('TxnId')) == str(invoice_id) and link.get('TxnType') == 'Invoice'
               for link in line.get('LinkedTxn', []))), Decimal('0'))
    response = payment.get('CreditCardPayment', {}).get('CreditChargeResponse', {})
    if (not payment.get('Id') or str(payment.get('CustomerRef', {}).get('value')) != str(customer_id)
            or _money(payment.get('TotalAmt')) != amount or linked_amount != amount
            or payment.get('CurrencyRef', {}).get('value', 'USD') != 'USD'
            or str(response.get('CCTransId')) != str(charge_id)):
        raise ValueError('QuickBooks payment linkage is unconfirmed. Accounting review required.')


def sync_order_payment(order, token):
    """Retry only orders explicitly marked pending by the new checkout flow."""
    from .models import QBConfig
    from .utils import _record_qb_payment, get_qb_accounting_base_url

    if not order.qb_payment_sync_pending:
        return
    config = QBConfig.get()
    if (order.payment_method != 'card' or order.paymet_status != 'success'
            or not order.qb_invoice_id or not order.qb_customer_id
            or str(config.realm_id) != order.qb_realm_id):
        raise ValueError('Order is not eligible for captured payment synchronization.')
    payment = _record_qb_payment(token, config.realm_id, get_qb_accounting_base_url(config),
        order.qb_customer_id, order.qb_invoice_id, order.amount, order.transaction_id)
    order.qb_payment_id = str(payment['Id'])
    order.qb_payment_sync_pending = False
    order.save(update_fields=['qb_payment_id', 'qb_payment_sync_pending'])
