# Website card payments and merchant deposits

Previously the website posted each captured card payment to hard-coded bank
account 162 and put its charge ID only in PrivateNote. The payment had no
structured Intuit processor identity for merchant deposit matching.

New card checkouts record the charge ID in PaymentRefNum and
CreditCardPayment.CreditChargeResponse.CCTransId, with authorization and
settlement references returned by Intuit. They link the payment to the order's
saved invoice and customer. ProcessPayment is false: this records an existing
charge and never asks QuickBooks to charge the card again.

DepositToAccountRef is omitted so QuickBooks uses Undeposited Funds rather than
posting a gross order total straight into checking. Actual payout grouping and
fees belong to QuickBooks Payments' deposit recording; the website does not
create a second deposit or estimate fees from order totals. Automatic matching
is the intended result, but must be verified in the connected company; these
local tests cannot establish that Intuit's merchant deposit service accepted
the association.

Failed payment records remain pending. Celery Beat schedules
payments.retry_pending_qb_payments every five minutes. Retries reuse the invoice,
verify the captured charge's amount and currency, find existing payment records
by PaymentRefNum, and use a stable Intuit requestid. A different customer,
company, charge or already reduced invoice balance requires review rather than
creating a duplicate. The routine can record a partial captured amount against
an invoice balance; checkout currently charges the full order amount. Payments
made through QuickBooks invoice links continue through QuickBooks' own flow.

## Rollout and verification

1. Deploy the backend and run `python manage.py migrate` to apply
   order.0038_order_qb_payment_sync before serving checkouts.
2. Restart the Celery worker and Beat so the new retry task and schedule load.
3. Verify the merchant account belongs to the same company as QBConfig. In
   QuickBooks Online, check Settings > Account and settings > Payments and its
   chart-of-accounts settings for deposit and fee recording.
4. In an Intuit sandbox/test company, confirm a website charge marks its exact
   invoice paid, retains the processor metadata on the Payment, and repeating
   a sync returns the same Payment ID. Test a failed sync/retry as well.
5. Verify a real settlement in the connected company before considering
   automatic deposit matching confirmed. Ensure the bank deposit and fees match
   the merchant payout, including refunds in the batch. Refund bookkeeping uses
   the existing refund implementation and was not changed here.

Historical orders default to `qb_payment_sync_pending=False`. They may already
have manual payments/deposits, so the migration does not recreate or move them.
An invoice-creation failure before an invoice ID is saved also needs review;
this retry job only repairs payment synchronization for a saved invoice.

## References

- Payment API (CreditCardPayment and invoice links):
  https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/Payment
- Intuit processor response fields:
  https://static.developer.intuit.com/sdkdocs/qbv3doc/ippdotnetdevkitv3/html/88c1c671-3a49-7afa-67aa-9b45be67e0f4.htm
- QBO Undeposited Funds and QuickBooks Payments deposits:
  https://quickbooks.intuit.com/learn-support/en-us/help-article/payroll-setup/deposit-payments-undeposited-funds-account-online/L1td0m8Z2_US_en_US

Tests use biopathproj.test_settings (in-memory SQLite), with provider requests
mocked. No live charges, refunds, deposits or account changes are made.
