# Shared variant SKU codes

The product's top-level SKU remains unique. Variant display SKUs may repeat
within that product. For disposable lab coats, configure Size (S/M/L) and
Package (Bag of 10/Case of 100), giving six combinations:

| Sizes | Package | Variant SKU | Price |
| --- | --- | --- | ---: |
| S, M, L | Bag of 10 | LS-50401 | $25 |
| S, M, L | Case of 100 | LS-50401-Case | $225 |

Each combination has its own existing ProductSKU primary key and stock.
Cart and order items now retain that key instead of looking up the first
matching SKU code. Legacy records resolve only when the code or exact
selected option set identifies one variant. Ambiguous selections are rejected.
Admin validation reports duplicate combinations or invalid values as form errors.

## Deployment

Deploy the backend and run `python manage.py migrate --noinput` before serving
requests with the new code. This removes the product/variant-SKU uniqueness
constraint and adds nullable variant references to carts and order items.
The migrations preserve existing rows and backfill unambiguous references.
The production migration has not been run from this workspace.

## QuickBooks

New invoice lines include the original SKU, size/package labels, and a stable
order-item reference. Item cancellation uses that reference before falling
back to an unambiguous legacy SKU match. Multiple matching legacy lines
require review rather than choosing the wrong item.

A unique QuickBooks catalog match is reused. When several QuickBooks items
share a SKU, the integration uses its configured default item instead of
arbitrarily selecting the first match. This does not create separate
size-specific QuickBooks inventory items; website stock remains per variant.

## Verification

Run with the repository virtual environment and isolated test settings:

```powershell
..\.venv\Scripts\python.exe -B manage.py test prd_variant.test_shared_skus order --settings=biopathproj.test_settings --noinput
```
