from rest_framework import serializers
from .models import VariantOption,Variant

class VariantOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantOption
        fields = ['id', 'value']

class VariantSerializer(serializers.ModelSerializer):
    variant_options = VariantOptionSerializer(many=True, read_only=True)  # ✅ nested

    class Meta:
        model = Variant
        fields = ['id', 'name', 'variant_options']