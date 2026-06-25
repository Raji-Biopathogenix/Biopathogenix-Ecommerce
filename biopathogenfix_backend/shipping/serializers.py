from rest_framework import serializers
from .models import Address


class AddressSerializer(serializers.ModelSerializer):
    state_code = serializers.SerializerMethodField()
    country_code = serializers.SerializerMethodField()
    state_name = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()

    def get_state_code(self, obj):
        return obj.state.code if obj.state else ""

    def get_country_code(self, obj):
        return obj.country.code if obj.country else ""

    def get_state_name(self, obj):
        return obj.state.name if obj.state else ""

    def get_country_name(self, obj):
        return obj.country.name if obj.country else ""

    class Meta:
        model = Address
        fields = (
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "state_code",
            "state_name",
            "country",
            "country_code",
            "country_name",
            "postal_code",
            "shipping_type",
            "user",
        )
        read_only_fields = ("id", "state_code", "state_name", "country_code", "country_name")
