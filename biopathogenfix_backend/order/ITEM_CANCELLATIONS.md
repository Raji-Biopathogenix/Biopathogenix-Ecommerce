# Item cancellation and proportional refunds

Deploy the backend and frontend together, then run `python manage.py migrate` before serving requests. Migration `0035_item_cancellation_ledger` stores the durable record for each item. No historical orders are automatically refunded by this migration.

Staff open **Orders > Edit > Cancel item**. The dialog previews the item price less its coupon allocation, plus its share of shipping and original tax. Confirming cancels the whole order line (all units in that line). It does not cancel other lines. A previously cancelled item without a ledger record exposes **Review cancellation** to complete its financial adjustment once.

Each charge component is allocated by item subtotal / original product subtotal. Largest-remainder rounding distributes every original cent exactly once. Saved, originally charged tax is allocated, rather than recalculating historical tax with today's configuration. Item-specific product discounts are already included in the saved item price. Mixed taxable/non-taxable invoices require review rather than using this proportional policy.

- Paid card order: refund the original Stripe or QuickBooks Payments charge, create a QuickBooks refund receipt with product, shipping, and tax amounts, and annotate the original invoice with the cancelled item, refund receipt and remaining value. Preserve the original invoice and payment amounts for the audit history; the receipt records the reversal. The customer order screen shows refunds and the remaining order value separately.
- Unpaid invoice: reduce that item line to zero, reduce allocated coupon/shipping/tax, and update the existing invoice. No card refund is sent.
- Packing slips omit cancelled items immediately. Cancelled items cannot be selected for a new outbound shipment.
- Pending/declined/uncertain refunds never generate a successful-refund email. Other item cancellations on the same order wait until the current financial operation is resolved.

The linked invoice, customer, company, totals and payment must reconcile before any refund is initiated. Partially paid invoices, missing charge references, external/manual refunds, mismatched historical invoice totals and mixed tax treatment need billing review. In particular, correcting an old invoice from $368.86 to $366.79 creates a separate $2.07 overpayment; reconcile that discrepancy before attempting an item refund.

## Recovery

The Django admin **Item cancellations** list is read-only and shows the operation ID, stage, refund reference and accounting reference. The operation is saved before making an external financial request. A timeout is never assumed to mean failure, and repeat cancellation requests cannot submit another refund.

Inspect locally with:

```
python manage.py reconcile_item_cancellation OPERATION_ID
```

Refresh a known pending refund, finish accounting, or retry an unsent notification:

```
python manage.py reconcile_item_cancellation OPERATION_ID --resume
```

If a timeout occurred after the provider accepted a refund/receipt, find the existing reference in the payment provider or QuickBooks, then verify and resume with:

```
python manage.py reconcile_item_cancellation OPERATION_ID --refund-id EXISTING_REFUND_ID --receipt-id EXISTING_RECEIPT_ID --resume
```

The command checks the original charge, refund amount, receipt customer and unique cancellation marker. It does not create a replacement card refund. If no external operation exists, or it was declined, billing must resolve the failed operation before the ledger is advanced; never delete a ledger record or issue an additional refund just to clear a pending message. QuickBooks API failures can require manual accounting completion and then verification with the existing receipt ID.

## Validation

```
python manage.py test order.test_item_cancellations order.test_invoices order.test_order_notifications order.test_email_images order.test_coupon_tax order.test_checkout_security --settings=biopathproj.test_settings --noinput
```

Tests use an isolated in-memory SQLite database and mocked external providers. Before production rollout, exercise a paid and unpaid multi-item order in the connected QuickBooks/Stripe sandbox to verify company-specific tax settings and refund-receipt rendering. No live refund or accounting mutation is performed by these tests.

Repository-wide migration checking also reports an existing, unrelated missing migration for `home.LandingPageContext.is_active`. The new order migration is consistent; review that separate schema change as part of deployment.
