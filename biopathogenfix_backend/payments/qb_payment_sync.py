"""Record captured Intuit charges without charging cards or inventing deposits."""
import uuid
from decimal import Decimal, InvalidOperation
from urllib.parse import quote

import requests


def invoice_marker(order, realm_id):
    return f'Website order {order.id}; Intuit charge {order.transaction_id}; company {realm_id}'


def find_order_invoice(token, realm_id, accounting_url, customer_id, order):
    """Recover an invoice whose response or local save was lost; never guess."""
    company_url = f'{accounting_url}/v3/company/{quote(str(realm_id), safe="")}'
    customer = str(customer_id).replace('\\', '\\\\').replace("'", "\\'")
    marker = invoice_marker(order, realm_id)
    matches = []
    start = 1
    while True:
        response = requests.get(company_url + '/query',
            headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'},
            params={'query': f"SELECT * FROM Invoice WHERE CustomerRef = '{customer}' STARTPOSITION {start} MAXRESULTS 1000"},
            timeout=15)
        response.raise_for_status()
        result = response.json()
        if 'Fault' in result or 'QueryResponse' not in result:
            raise ValueError('Unable to check existing QuickBooks invoices.')
        invoices = result['QueryResponse'].get('Invoice', [])
        matches.extend(invoice for invoice in invoices if invoice.get('PrivateNote') == marker)
        if len(invoices) < 1000:
            break
        start += 1000
    if len(matches) > 1:
        raise ValueError('Duplicate website invoices require accounting review.')
    if not matches:
        return None
    invoice = matches[0]
    if (not invoice.get('Id') or str(invoice.get('CustomerRef', {}).get('value')) != str(customer_id)
            or invoice.get('CurrencyRef', {}).get('value', 'USD') != 'USD'
            or _money(invoice.get('TotalAmt')) != _money(order.amount)):
        raise ValueError('Recovered invoice does not match the paid order.')
    return invoice


def _money(value):
    try:
        amount = Decimal(str(value))
        if not amount.is_finite() or amount != amount.quantize(Decimal('0.01')):
            raise ValueError('Invalid payment amount.')
        return amount
    except (InvalidOperation, TypeError):
        raise ValueError('Invalid payment amount.') from None


def record_captured_payment(token, realm_id, accounting_url, payments_url,
                            customer_id, invoice_id, amount, charge_id,
                            *, intuit_payment_linking=False):
    """Return the linked Payment; fail closed if existing books disagree.

    PaymentRefNum allows lookup after a timeout. requestid also makes concurrent
    submissions of the same charge idempotent at Intuit. Accounting confirmation
    here does not establish that the merchant payout has settled or linked.
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
    if context.get('merchantAccountNumber'):
        charge_response['MerchantAcctNum'] = str(context['merchantAccountNumber'])
    for source, target in (('paymentGroupingCode', 'PaymentGroupingCode'),
                           ('txnAuthorizationStamp', 'TxnAuthorizationStamp')):
        if context.get(source) is not None:
            value = str(context[source])
            if not value.isdigit():
                raise ValueError('Invalid processor reconciliation metadata.')
            charge_response[target] = int(value)
    payload = {
        'TotalAmt': float(amount), 'CustomerRef': {'value': str(customer_id)},
        'PaymentRefNum': str(charge_id), 'ProcessPayment': False,
        # Omitting DepositToAccountRef uses QBO's Undeposited Funds account.
        # Deposit recording is a separate Intuit workflow. A recorded Payment
        # alone does not confirm the bank settlement or processing fees.
        'CreditCardPayment': {'CreditChargeResponse': charge_response},
        'PrivateNote': f'QB Payments Transaction ID: {charge_id}; Invoice ID: {invoice_id}',
        'Line': [{'Amount': float(amount), 'LinkedTxn': [
            {'TxnId': str(invoice_id), 'TxnType': 'Invoice'}]}],
    }
    if intuit_payment_linking:
        payload['TxnSource'] = 'IntuitPayment'
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
    # QBO can omit CreditChargeResponse even when it accepted the payment.
    # Confirm accounting using the exact reference, customer, amount and invoice;
    # TxnSource identifies an Intuit payment when the optional response is absent.
    # Never treat a conflicting processor reference as a successful sync.
    returned_charge_id = response.get('CCTransId')
    processor_confirmed = (
        str(returned_charge_id) == str(charge_id) if returned_charge_id is not None
        else payment.get('TxnSource') == 'IntuitPayment'
    )
    if (not payment.get('Id') or str(payment.get('CustomerRef', {}).get('value')) != str(customer_id)
            or _money(payment.get('TotalAmt')) != amount or linked_amount != amount
            or payment.get('CurrencyRef', {}).get('value', 'USD') != 'USD'
            or str(payment.get('PaymentRefNum')) != str(charge_id)
            or not processor_confirmed):
        raise ValueError('QuickBooks payment linkage is unconfirmed. Accounting review required.')


def record_intuit_refund_receipt(token, realm_id, accounting_url, payments_url,
                                 customer_id, invoice_id, charge_id, refund_id,
                                 amount, payload, *, intuit_payment_linking=True):
    """Record an issued refund once, without refunding money or creating deposits.

    The nested Payments endpoint verifies the refund belongs to this charge.
    The invoice verifies the accounting customer. The stored marker and requestid
    support recovery after a timeout; merchant settlement is verified separately.
    """
    if not all((customer_id, invoice_id, charge_id, refund_id)):
        raise ValueError('Verified invoice, charge and refund references are required.')
    amount = _money(amount)
    if amount <= 0:
        raise ValueError('Refund amount must be positive.')
    headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
    company_url = f'{accounting_url}/v3/company/{quote(str(realm_id), safe="")}'

    def get(url, params=None):
        response = requests.get(url, headers=headers, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        if 'Fault' in data:
            raise ValueError('Unable to verify the QuickBooks refund records.')
        return data

    refund = get(f'{payments_url}/quickbooks/v4/payments/charges/'
                 f'{quote(str(charge_id), safe="")}/refunds/{quote(str(refund_id), safe="")}')
    if (str(refund.get('id')) != str(refund_id) or refund.get('status') != 'ISSUED'
            or _money(refund.get('amount')) != amount):
        raise ValueError('The issued refund does not match this charge and amount.')
    invoice = get(company_url + '/invoice/' + quote(str(invoice_id), safe='')).get('Invoice', {})
    if (str(invoice.get('Id')) != str(invoice_id)
            or str(invoice.get('CustomerRef', {}).get('value')) != str(customer_id)
            or invoice.get('CurrencyRef', {}).get('value', 'USD') != 'USD'
            or _money(invoice.get('TotalAmt')) < amount):
        raise ValueError('The refund invoice does not match this customer and amount.')
    if str(payload.get('CustomerRef', {}).get('value')) != str(customer_id):
        raise ValueError('The refund payload belongs to a different customer.')

    marker = f'Intuit refund {refund_id}; charge {charge_id}; invoice {invoice_id}'

    def validate(receipt):
        if (not receipt.get('Id')
                or str(receipt.get('CustomerRef', {}).get('value')) != str(customer_id)
                or _money(receipt.get('TotalAmt')) != amount
                or receipt.get('CurrencyRef', {}).get('value', 'USD') != 'USD'
                or (intuit_payment_linking and receipt.get('TxnSource') != 'IntuitPayment')
                or marker not in receipt.get('PrivateNote', '')):
            raise ValueError('QuickBooks refund accounting is unconfirmed; review before retrying.')
        return receipt

    customer = str(customer_id).replace('\\', '\\\\').replace("'", "\\'")
    matches = []
    start = 1
    while True:
        result = get(company_url + '/query', {'query':
            f"SELECT * FROM RefundReceipt WHERE CustomerRef = '{customer}' STARTPOSITION {start} MAXRESULTS 1000"})
        if 'QueryResponse' not in result:
            raise ValueError('Unable to check existing refund receipts.')
        rows = result['QueryResponse'].get('RefundReceipt', [])
        matches.extend(row for row in rows if marker in row.get('PrivateNote', ''))
        if len(rows) < 1000:
            break
        start += 1000
    if len(matches) > 1:
        raise ValueError('Duplicate refund receipts require accounting review.')
    if matches:
        return validate(matches[0])

    payload = {**payload, 'PrivateNote': (payload.get('PrivateNote', '') + '\n' + marker).strip()}
    if intuit_payment_linking:
        payload.update(TxnSource='IntuitPayment', CreditCardPayment={'CreditChargeResponse': {
            'CCTransId': str(refund_id), 'Status': 'Completed'}})
    response = requests.post(company_url + '/refundreceipt',
        headers={**headers, 'Content-Type': 'application/json'},
        params={'requestid': str(uuid.uuid5(uuid.NAMESPACE_URL, f'qb-refund:{realm_id}:{refund_id}'))},
        json=payload, timeout=15)
    response.raise_for_status()
    return validate(response.json().get('RefundReceipt', {}))


def sync_order_payment(order, token):
    """Retry only orders explicitly marked pending by the new checkout flow."""
    from .models import QBConfig
    from .utils import _record_qb_payment, get_qb_accounting_base_url, create_qb_invoice

    if not order.qb_payment_sync_pending:
        return
    config = QBConfig.get()
    if (order.payment_method != 'card' or order.paymet_status != 'success'
            or str(config.realm_id) != order.qb_realm_id):
        raise ValueError('Order is not eligible for captured payment synchronization.')
    if (getattr(order, 'status', '') in ('cancelled', 'refunded', 'partially_refunded')
            or getattr(order, 'is_partially_refunded', False)
            or (getattr(order, 'refund_amount', None) or 0) > 0
            or (getattr(order, 'refund_amt', None) or 0) > 0):
        raise ValueError('Changed or refunded orders require accounting review before synchronization.')
    if not order.qb_invoice_id:
        create_qb_invoice(token, order, order.items.all(), 'card', order.user)
        return
    if not order.qb_customer_id:
        raise ValueError('The invoice customer is missing; accounting review required.')
    payment = _record_qb_payment(token, config.realm_id, get_qb_accounting_base_url(config),
        order.qb_customer_id, order.qb_invoice_id, order.amount, order.transaction_id)
    order.qb_payment_id = str(payment['Id'])
    order.qb_payment_sync_pending = False
    order.save(update_fields=['qb_payment_id', 'qb_payment_sync_pending'])


def inspect_order_accounting(order, token, realm_id, accounting_url):
    """Read accounting records and report deposit evidence without posting money."""
    if str(order.qb_realm_id) != str(realm_id):
        raise ValueError('Order belongs to a different QuickBooks company.')
    result = {'invoice_id': order.qb_invoice_id, 'payment_id': '', 'deposits': []}
    if not order.qb_invoice_id or not order.qb_customer_id:
        result['status'] = 'invoice_link_missing'
        return result
    company_url = f'{accounting_url}/v3/company/{quote(str(realm_id), safe="")}'
    headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}

    def query(statement, entity):
        response = requests.get(company_url + '/query', headers=headers,
                                params={'query': statement}, timeout=15)
        response.raise_for_status()
        body = response.json()
        if 'Fault' in body or 'QueryResponse' not in body:
            raise ValueError('QuickBooks accounting lookup failed.')
        return body['QueryResponse'].get(entity, [])

    reference = str(order.transaction_id).replace('\\', '\\\\').replace("'", "\\'")
    payments = query(f"SELECT * FROM Payment WHERE PaymentRefNum = '{reference}'", 'Payment')
    if not payments:
        result['status'] = 'payment_link_missing'
        return result
    if len(payments) != 1:
        raise ValueError('Duplicate payment references require accounting review.')
    payment = payments[0]
    _validate_payment(payment, order.qb_customer_id, order.qb_invoice_id,
                      _money(order.amount), order.transaction_id)
    result['payment_id'] = str(payment['Id'])
    # Scan all deposits, with pagination: a payout may occur long after checkout.
    start = 1
    while True:
        deposits = query(f'SELECT * FROM Deposit STARTPOSITION {start} MAXRESULTS 1000', 'Deposit')
        for deposit in deposits:
            lines = [line for line in deposit.get('Line', []) if any(
                link.get('TxnType') == 'Payment' and str(link.get('TxnId')) == str(payment['Id'])
                for link in line.get('LinkedTxn', []))]
            if lines:
                result['deposits'].append({
                    'id': deposit.get('Id'), 'date': deposit.get('TxnDate'),
                    'batch_total': deposit.get('TotalAmt'),
                    'payment_amount': str(sum((_money(line.get('Amount')) for line in lines), Decimal('0'))),
                    'account_id': deposit.get('DepositToAccountRef', {}).get('value'),
                })
        if len(deposits) < 1000:
            break
        start += 1000
    result['status'] = 'linked_deposit_found' if result['deposits'] else 'linked_deposit_not_found'
    return result
