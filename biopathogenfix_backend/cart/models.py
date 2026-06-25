from django.db import models
from django.conf import settings
from product.models import Product
from variant.models import VariantOption



# Create your models here.
class Cart(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart', db_index=True)
    product = models.ForeignKey(Product,on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_amt = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_value =models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tmp_id =models.CharField(max_length=500, db_index=True)
    sku_code = models.CharField(max_length=500) 
    has_variants   = models.BooleanField(default=False)
    selected  = models.BooleanField(default=True)
    coupon_code = models.CharField(max_length=20, null=True,blank=True)
    coupon_val = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    coupon_type  = models.CharField(max_length=10,null=True,blank=True)
    is_customizable = models.BooleanField(default=False, db_index=True)
    shipping_amt = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)



    def __str__(self):
        return f"Cart - {self.user.email}"



class CartVariants(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='cart_variants')
    # variant_option_id = models.CharField(max_length=255)
    variant_option = models.ForeignKey(VariantOption, on_delete=models.CASCADE)

    def __str__(self):
        return f"Cart - {self.cart.id} - Variant Option - {self.variant_option_id}"

