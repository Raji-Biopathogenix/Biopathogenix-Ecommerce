from django.contrib import admin

# Register your models here.

from .models import Country,State

@admin.register(Country)
class Country(admin.ModelAdmin):
    list_display = ("name","code")
    list_filter = ("status",)



@admin.register(State)
class State(admin.ModelAdmin):
    list_display = ("name","code")
    list_filter = ("status",)
