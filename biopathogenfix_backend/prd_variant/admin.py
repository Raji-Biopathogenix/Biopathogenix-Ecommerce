from django.contrib import admin
from prd_variant.models import ProductVariantOption


@admin.register(ProductVariantOption)
class ProductVariantOptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'variant_option']