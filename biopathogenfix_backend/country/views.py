from django.shortcuts import render

from rest_framework.response import Response
# Create your views here.
from rest_framework import viewsets
from .models import Country,State
from rest_framework import status, permissions


from .serializer import CountrySerializer,StateListSerializer


class CountryViewset(viewsets.ModelViewSet):
    queryset = Country.objects.all().order_by("name")
    serializer_class = CountrySerializer

    def list(self, request, *args, **kwargs):
        countries = Country.objects.filter(status=True).order_by("name")
        countryData = CountrySerializer(countries,many=True).data
        return Response({
            "status": "success",
            "message":"Successfully data Fetched!",
            "result":{"data" : countryData}
        }, status=status.HTTP_200_OK)

    




class StateViewset(viewsets.ModelViewSet):
    queryset = State.objects.filter(status = True).order_by("name")
    serializer_class = StateListSerializer


    def list(self, request, *args, **kwargs):
        states = State.objects.filter(status = True).order_by("name")
        stateData = StateListSerializer(states,many=True).data
        return Response({
            "status": "success",
            "message":"Successfully data Fetched!",
            "result":{"data" : stateData}
        }, status=status.HTTP_200_OK)