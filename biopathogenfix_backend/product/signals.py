from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.core.cache import cache
from .models import Product, ProductDocument, ProductImage, Category
from prd_variant.models import ProductVariantOption, ProductSKU


#  HELPERS
def invalidate_product_cache(slug):
    """Delete cache for a specific product slug."""
    if slug:
        cache.delete(f"product_detail:{slug}")


def invalidate_category_cache(category):
    """Invalidate this category and its parent's cache."""
    if category:
        cache.delete(f"category_products:{category.slug}")
        if category.parent:
            cache.delete(f"category_products:{category.parent.slug}")


def invalidate_category_cache_for_product(product):
    """
    A product belongs to multiple categories.
    Walk up to each parent and delete that parent's cache key.
    """
    try:
        categories = product.categories.select_related('parent').all()
        for cat in categories:
            cache.delete(f"category_products:{cat.slug}")
            if cat.parent:
                cache.delete(f"category_products:{cat.parent.slug}")
    except Exception:
        pass

def invalidate_sub_category_cache(category):
    """
    Delete ALL cached pages/orders for a subcategory using wildcard pattern.
    Covers every: order_param × page_number combination.
    """
    if category:
        # pattern: subcategory_products:*:slug:*:*  or  subcategory_products:slug:*:*:*
        pattern_as_parent = f"subcategory_products:{category.slug}:*"
        pattern_as_child  = f"subcategory_products:*:{category.slug}:*"
        _delete_cache_pattern(pattern_as_parent)
        _delete_cache_pattern(pattern_as_child)


def _delete_cache_pattern(pattern):
    """Delete all Redis keys matching a pattern."""
    from django_redis import get_redis_connection
    conn = get_redis_connection("default")
    # KEY_PREFIX + version prefix Django adds internally
    full_pattern = f"*{pattern}*"
    keys = conn.keys(full_pattern)
    if keys:
        conn.delete(*keys)


#  PRODUCT SIGNALS
@receiver([post_save, post_delete], sender=Product)
def on_product_change(sender, instance, **kwargs):
    # Invalidate product detail cache
    invalidate_product_cache(instance.slug)
    # Invalidate category listing cache (product appears in category pages)
    invalidate_category_cache_for_product(instance)


#  PRODUCT RELATED MODEL SIGNALS  (variant, sku, doc, image)
@receiver([post_save, post_delete], sender=ProductVariantOption)
@receiver([post_save, post_delete], sender=ProductSKU)
@receiver([post_save, post_delete], sender=ProductDocument)
@receiver([post_save, post_delete], sender=ProductImage)
def on_related_change(sender, instance, **kwargs):
    """
    Invalidates both:
    - product_detail cache  (shown on product page)
    - category_products cache (product card shown on category page)
    """
    try:
        slug = instance.product.slug   
        invalidate_product_cache(slug)
        invalidate_category_cache_for_product(instance.product)
    except AttributeError:
        pass


#  CATEGORY SIGNALS
@receiver([post_save, post_delete], sender=Category)
def on_category_change(sender, instance, **kwargs):
    invalidate_category_cache(instance)


#  PRODUCT <-> CATEGORY  M2M SIGNALS
#  Fires when categories are added/removed from a product
@receiver(m2m_changed, sender=Product.categories.through)
def on_product_category_m2m_change(sender, instance, action, pk_set, **kwargs):
    if action in ("post_add", "post_remove", "post_clear"):
        if isinstance(instance, Product):
            # Invalidate product detail + all its category pages
            invalidate_product_cache(instance.slug)
            invalidate_category_cache_for_product(instance)
        elif isinstance(instance, Category):
            invalidate_category_cache(instance)


#  Update existing on_product_change to also clear subcategory cache 
@receiver([post_save, post_delete], sender=Product)
def on_product_change(sender, instance, **kwargs):
    invalidate_product_cache(instance.slug)
    invalidate_category_cache_for_product(instance)
    # also clear subcategory cache
    _invalidate_sub_category_cache_for_product(instance)


def _invalidate_sub_category_cache_for_product(product):
    try:
        categories = product.categories.select_related('parent').all()
        for cat in categories:
            invalidate_sub_category_cache(cat)
            if cat.parent:
                invalidate_sub_category_cache(cat.parent)
    except Exception:
        pass