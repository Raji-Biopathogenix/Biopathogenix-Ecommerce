# QuickBooks accounting synchronization

Card charging and accounting are separate operations. Keep the captured gross
payment amount, including shipping and tax. For example, a $290.44 payment and
$10.17 processing fee result in a $280.27 bank payout. Do not reduce the invoice
payment to the payout amount.

New card orders are marked pending when saved, before invoice creation. The
scheduled task retries missing invoices and payments every five minutes. Invoices
use a stable request ID and a private order/charge marker, allowing recovery after
a timeout. Checkout and retries lock the same order. A failed payment request
preserves an already saved invoice link. No accounting retry charges the card.

Payments include the processor charge and available settlement metadata. They
are recorded to QuickBooks' default Undeposited Funds account. Recording a Payment
does **not** establish that a bank Deposit or fee has been recorded.

## Deployment

- Deploy the backend changes and apply outstanding migrations (including order
  migration 0038) with `python manage.py migrate`.
- Ensure Redis, a Celery worker, and Celery beat are running. The worker must load
  `payments.retry_pending_qb_payments`; the beat schedule triggers it every five
  minutes. A worker alone does not run scheduled retries.
- Verify the connected QuickBooks company and merchant account, and QuickBooks'
  selected accounts for deposits and processing fees.

## Inspect and recover an order

From the backend directory, the default command is read-only:

```text
python manage.py reconcile_qb_payment 101
```

The report distinguishes a missing invoice link, missing Payment, and a Payment
with/without a linked Deposit. Deposits include their **entire batch total** and
the gross amount linked to this order's payment; the batch total may include
other customers. No linked Deposit found means no explicit Payment-to-Deposit
link was found, not proof that no manually entered deposit exists.

After reviewing existing accounting entries, resume a pending order or repair an
older captured payment that already has a stored invoice/customer/company link:

```text
python manage.py reconcile_qb_payment 101 --resume
```

The command verifies the captured charge and invoice/payment linkage and refuses
company, customer, amount or currency mismatches, duplicate references, and
changed/refunded orders. A fully paid invoice with no matching charge-linked
Payment requires review; the command will not post another payment. Historical
orders without stored invoice/customer/company links must be reviewed and mapped
to existing records first; the command will not guess or create a new invoice.

Run the read-only command again to inspect Deposit linkage. It never invents a
deposit, estimates fees, or moves funds. If the Payment exists but there is no
linked Deposit, verify Intuit's automatic deposit workflow and account settings,
and reconcile the actual merchant payout against bank transactions before posting
any settlement entries. The API code alone cannot confirm production settings
or reconcile a batch without its actual settlement data.

References:
- https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/Payment
- https://static.developer.intuit.com/sdkdocs/qbv3doc/ippdotnetdevkitv3/html/88c1c671-3a49-7afa-67aa-9b45be67e0f4.htm
- https://quickbooks.intuit.com/learn-support/en-us/help-article/process-credit-card-payments/common-questions-payments-deposits-quickbooks/L5Es6K29i_US_en_US
