from django.contrib import admin

# Register your models here.


from .models import Cart,CartVariants

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user','product','sku_code','total_price','quantity','selected','created_at']


@admin.register(CartVariants)
class CartVariantsAdmin(admin.ModelAdmin):
    list_display = ['cart','variant_option_id']