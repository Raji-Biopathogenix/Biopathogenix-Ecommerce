from django.db import models
from django.utils import timezone
# Create your models here.

class Coupon(models.Model):  

    DISCOUNT_TYPE_CHOICES = [
        ("percentage", "Percentage"),
        ("fixed", "Fixed Amount"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("expired", "Expired"),
    ]

    # Basic
    name         = models.CharField(max_length=25, unique=True, db_index=True)
    code         = models.CharField(max_length=20, unique=True, db_index=True,help_text=" user enters this")  #
    description  = models.TextField(blank=True, null=True)

    # Dates
    start_date   = models.DateField()
    end_date     = models.DateField()

    # Usage
    total_count  = models.PositiveIntegerField(default=0,help_text="max allowed uses (0 = unlimited)")   
    used_count   = models.PositiveIntegerField(default=0,help_text="how many times used so far")   
    per_user_limit = models.PositiveIntegerField(default=1,help_text="how many times one user can use") 

    # Price Conditions
    min_price    = models.DecimalField(max_digits=10, decimal_places=2, default=0.00,help_text="cart must be at least")  # 
    max_price    = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,help_text="cart must be at most") 

    # Discount 
    discount_type  = models.CharField(max_length=10, choices=DISCOUNT_TYPE_CHOICES, default="percentage")
    discount_value = models.DecimalField(max_digits=10, decimal_places=2,help_text="10 = '10%'  or $10")  

    #Status
    status       = models.CharField(max_length=10, choices=STATUS_CHOICES, default="active")
    is_active    = models.BooleanField(default=True)

    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Coupon"
        verbose_name_plural = "Coupons"

    def __str__(self):
        return f"{self.code} - {self.discount_value} ({self.discount_type})"

    def is_valid(self):
        now = timezone.now()
        return (
            self.is_active and
            self.start_date <= now <= self.end_date and
            (self.total_count == 0 or self.used_count < self.total_count)
        )

    def is_applicable(self, cart_total: float) -> bool:
        if cart_total < self.min_price:
            return False
        if self.max_price and cart_total > self.max_price:
            return False
        return True

    def calculate_discount(self, cart_total: float) -> float:
        if self.discount_type == "percentage":
            return round(float(cart_total) * float(self.discount_value) / 100, 2)
        return round(float(self.discount_value), 2)  # fixed