# QuickBooks item refund shipping tax

The cancellation allocation includes all original tax, including shipping tax.
QuickBooks requires `ShippingTaxIncludedInTotalTax: true` when overriding
`TxnTaxDetail.TotalTax`; otherwise it adds shipping tax separately.
Reference: https://github.com/intuit/QuickBooks-V3-PHP-SDK/blob/master/src/Data/IPPSalesTransaction.php

New refund receipts and unpaid invoice adjustments now include this flag.
Checkout prices and actual payment refund amounts are unchanged.

## Repair existing receipts after deploying the backend

Use the production database and the QuickBooks company linked to the order.
Find the cancellation operation IDs (not the order ID) in `ItemCancellation`
for order 97. Inspect each operation first:

```sh
python manage.py reconcile_item_cancellation <operation_id>
```

Repair its existing receipt and resume reconciliation:

```sh
python manage.py reconcile_item_cancellation <operation_id> --resume --repair-shipping-tax
```

If the existing receipt ID was not saved, supply its QuickBooks internal ID
with `--receipt-id <receipt_id>`. Do not use the displayed document number.
The command verifies the customer, cancellation marker, original payment
refund, and saved receipt lines before updating only the tax fields on the
existing receipt. It reads the receipt back and requires the exact refund
total before updating the invoice memo and completing reconciliation.
It never issues a new payment refund to repair a receipt. If a request times
out, inspect the same existing receipt and rerun; do not create a replacement.

Expected totals for ORD-000097:

| Item | Receipt total |
| --- | ---: |
| PK Buffer | $37.21 |
| Proteinase K | $63.79 |
| RNase P Verification Plate | $265.79 |
| Total | $366.79 |

The original paid invoice remains $366.79 with zero balance. Refunds remain
separate records. After all three operations complete, the website should
show no pending accounting reconciliation.

Validation uses an isolated in-memory database and mocked provider calls:

```sh
python -B manage.py test order.test_item_cancellations --settings=biopathproj.test_settings --noinput
```
