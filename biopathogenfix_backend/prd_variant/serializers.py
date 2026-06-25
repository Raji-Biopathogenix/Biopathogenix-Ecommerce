from rest_framework import serializers
from .models import ProductVariantOption,ProductSKUOption,ProductSKU
from variant.models import Variant,VariantOption



# class VariantSerializer(serializers.ModelSerializer):



class ProductSKUOptionSerializer(serializers.ModelSerializer):
    variant_option_id = serializers.IntegerField(source='variant_option.id')
    variant_option_name = serializers.CharField(source='variant_option.value')

    class Meta:
        model = ProductSKUOption
        fields = ['variant_option_name', 'variant_option_id']


class ProductSKUSerializer(serializers.ModelSerializer):
    sku_options = ProductSKUOptionSerializer(many=True, read_only=True)
    class Meta:
        model = ProductSKU
        fields = ['id', 'sku_code', 'price', 'stock','low_stock_threshold', 'sku_options']


class ProductVariantOptionSerializer(serializers.ModelSerializer):
    variant_options = ProductSKUOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = ProductSKU
        fields = ['id', 'sku_code', 'price', 'stock','low_stock_threshold', 'variant_options']


class CartItemSKUSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSKU
        fields = ['price', 'stock']



