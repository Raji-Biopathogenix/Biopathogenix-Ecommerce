# Whole-order QuickBooks refund recovery

Deploy the backend with migration `0039_whole_order_refund_recovery` and run
`python manage.py migrate`. Restart the web service, Celery worker and Celery beat.
The beat schedule polls pending provider refunds and accounting every five minutes.
These deployment steps have not been applied to production.

Each new whole-order Intuit refund has a separate `OrderRefund` record. Its UUID
request ID and original charge/company/customer/invoice are saved before submitting
the refund. The provider refund ID is separate from the optional staff reference.
Existing historical refunds are not automatically imported or replayed.

States:

- `provider_pending`: a known provider refund is not issued yet. Poll its ID;
  do not submit another refund or count it as completed.
- `accounting_pending`: money was refunded; recording the refund receipt failed.
  Retry receipt lookup/creation with the same reference and request ID.
- `complete`: the accounting receipt ID was confirmed. This does not prove
  merchant payout settlement, fees, or bank reconciliation.
- `submitting` / `review`: the provider outcome may be unknown. Automatic retry
  must not issue another refund. Verify the provider refund ID first.
- `failed`: the provider declined/failed the refund. No accounting receipt is made.
- `ready`: a prepared request has not been submitted; connection failures remain
  visible and staff may repeat the original request with the same amount.

Django admin's **Order refunds** list shows state, provider ID, accounting ID and
saved error. The order API exposes `refund_accounting_state` and `qb_refund_id`.
The refund response/dialog distinguishes pending follow-up from completion.

Inspect a saved operation without external writes:

```powershell
python manage.py reconcile_qb_refund <operation-id>
```

Recover an uncertain submission only after obtaining its actual provider refund ID:

```powershell
python manage.py reconcile_qb_refund <operation-id> --provider-refund-id <verified-id> --retry-accounting
```

This verifies the refund through the original charge's refund endpoint, including
the exact amount, before allowing accounting recovery. It never submits a new
provider refund. For a known accounting failure, `--retry-accounting` alone is
sufficient; the worker also retries automatically.

`QB_INTUIT_PAYMENT_LINKING_ENABLED` remains false by default. Refund receipt
recovery/deduplication works with this switch off; enabling it also adds Intuit
payment-origin metadata. Enabling it does not establish payout linkage by itself.

Generated local databases, sandbox result JSON, `resp.json` and `ppt_dump.txt` are
ignored by Git and must not be included in commits.
