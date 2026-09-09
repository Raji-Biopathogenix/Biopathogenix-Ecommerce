# Customer invoices

Run `python manage.py migrate` when deploying this change. Migration 0034 adds
the QuickBooks invoice, company, and customer IDs to each order. New invoices
save these IDs before recording a card payment.

Shipping uses the reserved `SHIPPING_ITEM_ID` instead of a product named
Shipping. Enable shipping in the connected QuickBooks company's sales form
settings (`SalesFormsPrefs.AllowShipping`). The checkout tax estimate uses the
same shipping reference. Verify a new sandbox invoice's PDF shows shipping
below subtotal and that its total agrees with checkout before production use.
Existing QuickBooks invoices are not rewritten by this change.

My Orders displays an order summary and a View invoice panel. The panel reads
the current balance from QuickBooks on opening or refreshing and offers its
PDF through an authenticated endpoint. No QuickBooks access tokens reach the
browser. A customer can only access invoices attached to their own orders,
and the company and invoice customer must match the saved association.

Pay invoice appears only if QuickBooks returns an HTTPS Intuit InvoiceLink
and the invoice has a positive balance. Existing successful card payments
suppress that action while QuickBooks payment recording catches up. This
feature does not enable online payments on invoices or change payment methods.
QuickBooks needs online payment enabled and a customer email to supply that
link: https://help.developer.intuit.com/s/question/0D5TR000002nScJ0AU/how-we-can-get-payment-link-of-a-specific-invoice-from-where-can-we-get-payment-link-through-api-using-php-sdk-

Older orders have no invoice association. After verifying the matching invoice
in QuickBooks, staff can set `qb_invoice_id`, `qb_realm_id`, and `qb_customer_id`
in Django's Order admin. Use the API invoice ID, not the displayed invoice
number. No automatic matching by customer or amount is performed.

Validation: `python manage.py test order.test_invoices --noinput`.
Live invoice creation, PDF layout, and payment-link availability still require
verification against the connected QuickBooks company.
