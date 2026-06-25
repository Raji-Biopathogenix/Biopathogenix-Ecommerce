
from django.db.models.base import Model
from rest_framework import serializers

from .models import Country,State


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ("name","code","id")



class StateListSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = ("name","code","id")