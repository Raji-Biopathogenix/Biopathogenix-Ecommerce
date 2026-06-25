from rest_framework import serializers
from .models import Cart
from product.serializers import CartProductItemSerializer
#ProductListSerializer
from product.models import Product
from prd_variant.models import ProductSKU
from prd_variant.serializers import CartItemSKUSerializer
from api.views import get_or_none


class CartSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cart
        fields = ('__all__')

class CartCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cart
        fields = ('__all__')


class CartUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cart
        fields = ('__all__')




class CartResponseSerializer(serializers.ModelSerializer):
    product_obj=serializers.SerializerMethodField()
    product_sku=serializers.SerializerMethodField()
    variant_options = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = (
            "id",
            "user",
            "product",
            "quantity",
            "price",
            "tax_value",
            "tmp_id",
            "product_obj",
            "total_price",
            "discount_value",
            "discount_amt",
            "has_variants",
            "variant_options",
            "product_sku",
            "selected",
            "coupon_code",
            "coupon_val",
            "coupon_type",
            'sku_code',
            'shipping_amt'
        )
    
    def get_product_obj(self,obj):
        if obj.product != "" and obj.product is not None:
            request = self.context.get("request")
            product=get_or_none(Product,id=obj.product.id)
            return CartProductItemSerializer(product,context={'request': request,'user_id':self.context.get("user_id")}).data

    def get_product_sku(self,obj):
        if obj.product != "" and obj.product is not None:
            sku=get_or_none(ProductSKU,product= obj.product, sku_code=obj.sku_code)
            return CartItemSKUSerializer(sku).data
    


    
    def get_variant_options(self, obj):
        variant_entries = obj.cart_variants.select_related("variant_option__variant").all()
        variant_list = []

        for entry in variant_entries:
            option = entry.variant_option
            if not option:
                continue
            variant = option.variant
            variant_list.append({
                "variant_option_id": option.id,
                "variant_name": variant.name if variant else "",
                "variant_value": option.value or "",
            })

        return variant_list
    
