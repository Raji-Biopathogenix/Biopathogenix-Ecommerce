from django.contrib import admin

# Register your models here.

from .models import Order, OrderStatusUpdate,Shipment,OrderItem


class OrderStatusUpdateInline(admin.TabularInline):
    model = OrderStatusUpdate
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("customer_name", "shipping_email", "product_list", "shipping_address", "total_amount", "tracking_number_display")
    search_fields = ("shipping_email", "shipping_first_name", "shipping_last_name", "user__email")
    inlines = (OrderStatusUpdateInline,)

    def has_delete_permission(self, request, obj=None):
        return False

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("items")

    def customer_name(self, obj):
        name_parts = [obj.shipping_first_name, obj.shipping_last_name]
        full_name = " ".join(part for part in name_parts if part).strip()
        if full_name:
            return full_name
        user_full_name = getattr(obj.user, "get_full_name", None)
        if callable(user_full_name):
            user_full_name = user_full_name()
        return user_full_name or obj.user.email
    customer_name.short_description = "Name"

    def product_list(self, obj):
        return ", ".join(item.product_name for item in obj.items.all())
    product_list.short_description = "Products"

    def shipping_address(self, obj):
        address_parts = [
            obj.shipping_address_line1,
            obj.shipping_address_line2,
            obj.shipping_city,
            obj.shipping_state,
            obj.shipping_postal_code,
            obj.shipping_country,
        ]
        return ", ".join(part for part in address_parts if part)
    shipping_address.short_description = "Address"

    def total_amount(self, obj):
        return obj.amount
    total_amount.short_description = "Total"

    def tracking_number_display(self, obj):
        return obj.tracking_number or "-"
    tracking_number_display.short_description = "Tracking"



@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ['id','order','shipment_type','status','tracking_number','shipment_id']
    search_fields = ['order__id', 'tracking_number', 'shipment_id']
    list_filter = ['shipment_type', 'status']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id','order','product_name','sku_code','quantity','unit_price','total']
    search_fields = ['order__id', 'sku_code', 'product_name']
    list_filter = ['product_name', 'sku_code']