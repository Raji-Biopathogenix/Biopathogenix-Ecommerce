from django.contrib import admin
from django.db.utils import OperationalError, ProgrammingError

# Register your models here.

from .models import QBConfig, TaxConfig, UPSConfig, StripeConfig

@admin.register(QBConfig)
class QBConfigAdmin(admin.ModelAdmin):
    list_display  = ["environment", "realm_id", "updated_at"]
    readonly_fields = ["updated_at", "created_at"]

    def has_add_permission(self, request):
        # Only allow ONE row
        try:
            return not QBConfig.objects.exists()
        except (ProgrammingError, OperationalError):
            # Table may not exist before migrations.
            return True

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(TaxConfig)
class TaxConfigAdmin(admin.ModelAdmin):
    list_display = ["provider", "enabled", "use_sandbox", "nexus_state", "nexus_zip", "updated_at"]
    readonly_fields = ["updated_at", "created_at"]
    fieldsets = (
        ("Provider", {"fields": ("enabled", "provider", "api_key", "use_sandbox")}),
        ("Nexus Address", {"fields": ("nexus_country", "nexus_zip", "nexus_state", "nexus_city", "nexus_street")}),
        ("Audit", {"fields": ("updated_at", "created_at")}),
    )

    def has_add_permission(self, request):
        try:
            return not TaxConfig.objects.exists()
        except (ProgrammingError, OperationalError):
            # Table may not exist before migrations.
            return True

    def has_delete_permission(self, request, obj=None):
        return False
    
admin.site.register(UPSConfig)


@admin.register(StripeConfig)
class StripeConfigAdmin(admin.ModelAdmin):
    list_display = ["enabled", "publishable_key_preview", "secret_key_preview", "updated_at"]
    readonly_fields = ["updated_at", "created_at"]
    fieldsets = (
        ("Stripe Keys", {"fields": ("enabled", "publishable_key", "secret_key")} ),
        ("Audit", {"fields": ("updated_at", "created_at")} ),
    )

    def publishable_key_preview(self, obj):
        key = obj.publishable_key or ""
        return f"{key[:8]}..." if key else ""

    publishable_key_preview.short_description = "Publishable Key"

    def secret_key_preview(self, obj):
        key = obj.secret_key or ""
        return f"{key[:8]}..." if key else ""

    secret_key_preview.short_description = "Secret Key"

    def has_add_permission(self, request):
        try:
            return not StripeConfig.objects.exists()
        except (ProgrammingError, OperationalError):
            return True

    def has_delete_permission(self, request, obj=None):
        return False
