"""Resolve variant identity independently of the customer-facing SKU code."""
from .models import ProductSKU


def resolve_sku(product_id, sku_code=None, option_ids=None, sku_id=None):
    candidates = ProductSKU.objects.filter(product_id=product_id)
    if sku_id is not None:
        candidates = candidates.filter(pk=sku_id)
    elif sku_code:
        candidates = candidates.filter(sku_code=sku_code)
    candidates = list(candidates.prefetch_related('sku_options'))
    if option_ids is not None:
        wanted = {int(value) for value in option_ids}
        candidates = [sku for sku in candidates
                      if {option.variant_option_id for option in sku.sku_options.all()} == wanted]
    return candidates[0] if len(candidates) == 1 else None


def sku_for_item(item):
    if item.sku_id:
        return resolve_sku(item.product_id, sku_id=item.sku_id)
    # Existing carts/orders predate the identity field. Match their exact options;
    # never choose the first of several variants sharing a printed SKU.
    relation = item.cart_variants if hasattr(item, 'cart_variants') else item.orderItems_variants
    options = list(relation.values_list('variant_option_id', flat=True))
    return resolve_sku(item.product_id, item.sku_code, options if options else None)
