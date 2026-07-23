from django.db import models

# Create your models here.
from django.contrib.auth import get_user_model

User = get_user_model()


class QBConfig(models.Model):
    """
    Single row table — stores Biopathogenix's QuickBooks OAuth tokens.
    NO end user involvement. This is your platform's QB account only.
    Managed via Django Admin.
    """
    access_token  = models.TextField(help_text="QB Access Token (auto-refreshed)")
    refresh_token = models.TextField(help_text="QB Refresh Token (rotates every 100 days)")
    realm_id      = models.CharField(max_length=100, help_text="QB Company ID")
    environment   = models.CharField(
        max_length=20,
        choices=[("sandbox", "Sandbox"), ("production", "Production")],
        default="sandbox"
    )
    updated_at    = models.DateTimeField(auto_now=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "QuickBooks Config"
        verbose_name_plural = "QuickBooks Config"

    @classmethod
    def get(cls):
        """Always returns the single QB config row."""
        config = cls.objects.first()
        if not config:
            raise Exception(
                "QuickBooks not configured. "
                "Please add QB tokens in Django Admin → Payments → QuickBooks Config."
            )
        return config

    def __str__(self):
        return f"QB Config [{self.environment}] (updated {self.updated_at:%Y-%m-%d %H:%M})"


class TaxConfig(models.Model):
    """
    Single-row tax provider configuration.
    Mirrors QBConfig style so admins can manage it in Django Admin.
    """
    provider = models.CharField(
        max_length=20,
        choices=[("quickbooks", "QuickBooks"), ("taxjar", "TaxJar"), ("fallback", "Fallback Table")],
        default="quickbooks",
    )
    enabled = models.BooleanField(default=True)
    api_key = models.CharField(max_length=255, blank=True, help_text="Tax provider API key")
    use_sandbox = models.BooleanField(default=True)

    nexus_country = models.CharField(max_length=10, default="US")
    nexus_zip = models.CharField(max_length=20, default="40356")
    nexus_state = models.CharField(max_length=10, default="KY")
    nexus_city = models.CharField(max_length=100, default="Nicholasville")
    nexus_street = models.CharField(max_length=255, default="120 Dewey Drive")

    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Tax Config"
        verbose_name_plural = "Tax Config"

    @classmethod
    def get(cls):
        return cls.objects.first()

    def __str__(self):
        mode = "sandbox" if self.use_sandbox else "live"
        return f"Tax Config [{self.provider}:{mode}] (updated {self.updated_at:%Y-%m-%d %H:%M})"


class UPSConfig(models.Model):
    name = models.CharField(max_length=255, default="Store Name")
    street = models.TextField(help_text="")
    state = models.CharField(max_length=10, default="KY")
    country = models.CharField(max_length=10, default="US")
    city = models.CharField(max_length=100, default="Nicholasville")
    zip = models.CharField(max_length=20, default="40356")
    phone = models.CharField(max_length=10, null=True,blank=True)
    account_num = models.CharField(max_length=20, default="40356")

    @classmethod
    def get(cls):
        return cls.objects.first()
    

    def __str__(self):
        return self.name


class StripeConfig(models.Model):
    """
    Single-row Stripe configuration.
    Stores the platform Stripe keys in Django admin so they can be updated
    without editing deployment environment variables.
    """
    enabled = models.BooleanField(default=True)
    publishable_key = models.CharField(
        max_length=255,
        blank=True,
        help_text="Stripe publishable key used by the frontend",
    )
    secret_key = models.CharField(
        max_length=255,
        blank=True,
        help_text="Stripe secret key used by the backend",
    )
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Stripe Config"
        verbose_name_plural = "Stripe Config"

    @classmethod
    def get(cls):
        config = cls.objects.first()
        if not config:
            raise Exception(
                "Stripe not configured. "
                "Please add Stripe settings in Django Admin → Payments → Stripe Config."
            )
        return config

    def __str__(self):
        status = "enabled" if self.enabled else "disabled"
        return f"Stripe Config [{status}] (updated {self.updated_at:%Y-%m-%d %H:%M})"


