from django.contrib import admin
from .models import Coupon
from comment.mixins import CommentInline, CommentMixin

# Register your models here.
@admin.register(Coupon)
class CouponAdmin(CommentMixin,admin.ModelAdmin):
    list_display = [
        'name',
        'code',
        'discount_type',
        'discount_value',
        'status',
        'is_active'
    ]
    inlines = [CommentInline]