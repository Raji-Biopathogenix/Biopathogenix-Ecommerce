# Checkout card verification

Intuit's Charge response exposes `avsStreet`, `avsZip`, and
`cardSecurityCodeMatch` at the top level. Checkout now checks each result
independently. The previous code looked inside `card`/`avsDetail`, expected
single-letter AVS codes, and accepted missing or unrecognized results.

Policy:

- Both street and ZIP must return `Pass`. `Fail`, `NotAvailable`, missing and
  unrecognized results are rejected. AVS verifies the address components
  supported by the issuer; it is not a complete identity or mailing-address check.
- Newly entered cards also require security-code `Pass`.
- Saved cards allow missing or `NotAvailable` security-code results because
  the vault does not retain CVV. Explicit failures and unknown results are
  rejected. Saved-card street and ZIP still require `Pass`.
- Before a saved-card charge, checkout's selected street and ZIP must match
  the authenticated user's vault record. If missing or different, the customer
  must use the recorded billing address or enter the card again with its
  current billing address. Shipping can differ from billing.

The current integration captures the charge before checking the response.
Rejected verification therefore reverses that charge through Intuit's
`POST /quickbooks/v4/payments/txn-requests/{original-charge-request-id}/void`.
The reversal has a stable Request-Id and succeeds only with a confirmed
`type=VOID`, `status=ISSUED`, and reversal ID. Temporary bank holds may remain
while the issuer processes the reversal.

No order is created for a verification rejection. After confirmed reversal,
the API allows a corrected attempt and instructs the checkout to rotate its
idempotency key. An unconfirmed reversal returns `retry=false` and the charge
reference, triggers the existing billing alert, and displays the existing
checkout review screen. It does not tell the customer that money was returned.
Billing must inspect the provider record before retrying or refunding.

Banks unable to provide street/ZIP verification, and new cards with unavailable
CVV verification, cannot use this strict card flow. The customer can use
another card or the existing invoice payment option.

Deploy the backend and frontend together. There is no new database migration
for this change. Test approved and failed verification responses in the Intuit
sandbox and check the configured merchant settings before production rollout.
Tests use mocked requests and an isolated database; no live card transactions,
reversals, or billing alerts were issued during development.

References:

- Intuit Charge response fields:
  https://github.com/intuit/PHP-Payments-SDK/blob/master/src/Modules/Charge.php
- Intuit verification result definitions:
  https://static.developer.intuit.com/sdkdocs/qbv3doc/ippdotnetdevkitv3/html/88c1c671-3a49-7afa-67aa-9b45be67e0f4.htm
- Intuit's void request and endpoint:
  https://github.com/intuit/PHP-Payments-SDK/blob/master/src/Operations/ChargeOperations.php
  https://github.com/intuit/PHP-Payments-SDK/blob/master/src/Operations/EndpointUrls.php
