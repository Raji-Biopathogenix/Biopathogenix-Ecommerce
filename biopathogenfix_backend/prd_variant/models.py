from django.db import models

# Create your models here.

from product.models import Product
from variant.models import VariantOption


class ProductVariantOption(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variant_options')
    variant_option = models.ForeignKey(VariantOption, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('product', 'variant_option')

    def __str__(self):
        return f"{self.product.name} → {self.variant_option.variant.name} → {self.variant_option.value}"
    


class ProductSKU(models.Model):
    product  = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='skus')
    sku_code = models.CharField(max_length=500)   
    price    = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stock    = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=5)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    weight = models.DecimalField(max_digits=10, decimal_places=2,default=0.00,help_text="Weight in LBS")
    length = models.DecimalField(max_digits=10, decimal_places=2,default=0.00,help_text="Length in IN")
    width = models.DecimalField(max_digits=10, decimal_places=2,default=0.00,help_text="Width in IN")
    height = models.DecimalField(max_digits=10, decimal_places=2,default=0.00,help_text="Height in IN")

    class Meta:
        unique_together = ('product', 'sku_code')

    def __str__(self):
        return f"{self.product.name} | {self.sku_code}"



class ProductSKUOption(models.Model):
    sku = models.ForeignKey(ProductSKU, on_delete=models.CASCADE, related_name='sku_options')
    variant_option = models.ForeignKey(VariantOption, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('sku', 'variant_option')

    def __str__(self):
        return f"{self.sku.sku_code} → {self.variant_option.value}"
