from django.contrib import admin

# Register your models here.

from .models import Settings


@admin.register(Settings)
class SettingsAdmin(admin.ModelAdmin):
    list_display= ['name', 'value','description']


