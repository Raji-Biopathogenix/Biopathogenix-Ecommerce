from rest_framework import serializers
from django.core.validators import validate_email
from django.db import transaction
from .models import CustomUser,CustomizableProductprices
# CustomerProductPrices




class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'Company_name',
            'Street_Address', 'Address_Line_2', 'state',
            'Town_City', 'Zip_Code', 'phone_number', 'is_active', 'date_joined'
        ]
        read_only_fields = ('date_joined',)

    def validate_email(self, value):
        user_id = self.instance.id if self.instance else None
        if CustomUser.objects.exclude(id=user_id).filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        try:
            validate_email(value)
        except Exception:
            raise serializers.ValidationError("Enter a valid email address.")
        return value.lower().strip()

    def validate(self, data):
        return data

    @transaction.atomic
    def create(self, validated_data):
        user = CustomUser(**validated_data)
        user.set_unusable_password()  # Password will be set in the view
        user.save()
        return user

    @transaction.atomic
    def update(self, instance, validated_data):
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        return instance


# Keep role-specific serializers but point them to UserProfile (convenience wrappers)
class SuperAdminSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        model = CustomUser

class ManagerSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        model = CustomUser

class HRSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        model = CustomUser

class ExternalUserSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        model = CustomUser

class Hiring_managerSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        model = CustomUser


class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # include only lightweight fields for list endpoints
        fields ='__all__'




class CustomizableProductpriceSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomizableProductprices
        fields =  ['price']
