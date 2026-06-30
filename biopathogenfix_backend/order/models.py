import logging
from django.db import models
from django.conf import settings
from product.models import Product
from variant.models import VariantOption
from datetime import timedelta
from django.utils import timezone
from settings.models import Settings
from api.views import get_or_none

logger = logging.getLogger(__name__)

# Create your models here.
class Order(models.Model):
    EMAIL_EXCLUDED_STATUS_NOTIFICATIONS = {
        'cancelled',
        'partially_refunded',
        'refunded',
    }
    PAYMENT_STATUS = (('pending', 'Pending'), ('success', "Success"))
    ORD_STATUS = (('a', 'Approved'),('c', 'Cancelled'),('p', 'Pending'),('r', 'Rejected'))
    RETURN_STATUS = (
        ('none', 'None'),
        ('issued', 'Issued'),
        ('declined',  'Declined'),
    )

    STATUS_CHOICES = (
        # Initial
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        # Fulfillment
        ('processing', 'Processing'),
        ('partially_shipped', 'Partially Shipped'),
        ('shipped', 'Shipped'),
        # Delivery
        ('partially_delivered', 'Partially Delivered'),
        ('delivered', 'Delivered'),
        # Return
        ('return_initiate', 'Return initiated'),
        ('partially_returned', 'Partially Returned'),
        ('returned', 'Returned'),
        # Final
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('partially_refunded', 'Partially Refunded'),
        ('refunded', 'Refunded'),
    )


    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='order')
    transaction_id    = models.CharField(max_length=100, unique=True)
    idempotency_key   = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status            = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    paymet_status     = models.CharField(max_length=20, choices=PAYMENT_STATUS, default="pending")


    payment_method    = models.CharField(max_length=50, default="card")
    card_last4        = models.CharField(max_length=4,   blank=True)
    card_brand        = models.CharField(max_length=20,  blank=True)
    card_name         = models.CharField(max_length=100, blank=True)

    # Shipping
    shipping_first_name   = models.CharField(max_length=100, blank=True)
    shipping_last_name    = models.CharField(max_length=100, blank=True)
    shipping_email        = models.EmailField(blank=True)
    shipping_phone        = models.CharField(max_length=30,  blank=True)
    shipping_address_line1= models.TextField(blank=True)
    shipping_address_line2= models.TextField(blank=True)
    shipping_city         = models.CharField(max_length=100, blank=True)
    shipping_state        = models.CharField(max_length=100, blank=True)
    shipping_state_code   = models.CharField(max_length=5, blank=True)
    shipping_postal_code  = models.CharField(max_length=20,  blank=True)
    shipping_country      = models.CharField(max_length=100, blank=True)
    tracking_number       = models.CharField(max_length=255, blank=True)

    # Billing
    billing_first_name    = models.CharField(max_length=100, blank=True)
    billing_last_name     = models.CharField(max_length=100, blank=True)
    billing_address_line1 = models.TextField(blank=True)
    billing_city          = models.CharField(max_length=100, blank=True)
    billing_state         = models.CharField(max_length=100, blank=True)
    billing_state_code    = models.CharField(max_length=5, blank=True)
    billing_postal_code   = models.CharField(max_length=20,  blank=True)
    billing_country       = models.CharField(max_length=100, blank=True)

    # Financials
    amount         = models.DecimalField(max_digits=10, decimal_places=2,default=0)
    shipping_cost  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount     = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_rate       = models.DecimalField(max_digits=5,  decimal_places=4, default=0)
    subtotal       = models.DecimalField(max_digits=10, decimal_places=2, default=0)


    # coupon
    coupon_code = models.CharField(max_length=20, null=True,blank=True)
    coupon_val = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    coupon_amt = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    coupon_type  = models.CharField(max_length=10,null=True,blank=True)

    customer_notes = models.TextField(blank=True)
    return_requested_reason = models.TextField(blank=True)
    return_rejected_reason = models.TextField(blank=True)
    refund_amt = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    delivered_date = models.DateField(null=True,blank=True)


    # ups_shipment_id       = models.CharField(max_length=255, blank=True)
    # shipping_label_url    = models.TextField(blank=True)        # base64 label from UPS
    # shipping_service_code = models.CharField(max_length=10, blank=True)   # 03 = Ground
    # shipping_service_name = models.CharField(max_length=100, blank=True)  # UPS Ground
    # shipment_created_at   = models.DateTimeField(null=True, blank=True)

    shipment_id         = models.CharField(max_length=30, blank=True, null=True)
    carrier             = models.CharField(max_length=10, default='UPS')
    shipment_status     = models.CharField(max_length=20, default='label_created')
    shipping_label      = models.ImageField(upload_to='shipping_labels/', blank=True, null=True)
    ups_transaction_ref = models.CharField(max_length=50, blank=True, null=True)
    label_created_at    = models.DateTimeField(blank=True, null=True)


    ups_status_code   = models.CharField(max_length=10,  null=True, blank=True)
    ups_status_desc   = models.CharField(max_length=255, null=True, blank=True)
    ups_last_location = models.CharField(max_length=255, null=True, blank=True)
    ups_last_event_at = models.DateTimeField(null=True, blank=True)
    ups_last_synced_at= models.DateTimeField(null=True, blank=True)


    # cancelled_at = models.DateTimeField(null=True, blank=True)
    # cancelled_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,null=True, blank=True,related_name='cancelled_orders')
    # cancel_notes = models.TextField(null=True, blank=True)

    is_partially_refunded = models.BooleanField(default=False)
    refund_status     = models.CharField(max_length=20, choices=RETURN_STATUS, default="none")
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    refunded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,null=True, blank=True,related_name='refunded_orders')
    refund_notes = models.TextField(null=True, blank=True)
    refund_reference = models.CharField(max_length=100, null=True, blank=True)

    
    


    def __str__(self):
        return f"Cart - {self.user.email}"
    
    @property
    def fullName(self):
        return f"{self.shipping_first_name} {self.shipping_last_name}"
    
    @property
    def is_cancellable(self):
        return self.status not in ('cancelled', 'refunded', 'partially_refunded','shipped', 'partially_shipped', 'delivered','partially_delivered', 'completed')
    
    

    @property
    def is_refundable(self):
        print("Checking refund eligibility for order", self.id, "with status", self.status, "and refund amount", self.refund_amount,"===>",self.status in ('returned', 'partially_returned','cancelled') and self.refund_amount == 0.00," and returning ", self.status in ('returned', 'partially_returned','cancelled'))
        
        return self.status in ('returned', 'partially_returned','cancelled') 
    # and self.refund_amount == 0.00


    
    
    def update_status(self):
        """
        Auto calculate order status based on all shipments + items.
        Called via signal every time a Shipment or OrderItem changes.
        """
        outbound  = self.shipments.filter(shipment_type='outbound')
        items     = self.items.all()

        total_shipments      = outbound.count()
        delivered_shipments  = outbound.filter(status='delivered').count()
        shipped_shipments    = outbound.filter(
            status__in=['picked_up', 'in_transit', 'delivered']
        ).count()

        total_items    = items.count()
        returned_items = items.filter(is_returned=True).count()

        if self.status in ('cancelled', 'refunded'):
            return  # don't overwrite terminal states

        if total_items > 0 and returned_items == total_items:
            self.status = 'returned'

        elif returned_items > 0:
            self.status = 'partially_returned'

        elif total_shipments > 0 and delivered_shipments == total_shipments:
            self.status = 'delivered'

        elif delivered_shipments > 0:
            self.status = 'partially_delivered'

        elif total_shipments > 0 and shipped_shipments == total_shipments:
            self.status = 'shipped'

        elif shipped_shipments > 0:
            self.status = 'partially_shipped'

        elif total_shipments > 0:
            self.status = 'processing'

        self.save(update_fields=['status', 'updated_at'])

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        previous_status = None

        if not is_new and self.pk:
            previous_status = (
                Order.objects.filter(pk=self.pk)
                .values_list('status', flat=True)
                .first()
            )

        super().save(*args, **kwargs)

        if is_new:
            OrderStatusUpdate.objects.get_or_create(
                order=self,
                status=self.status,
                defaults={"notes": "Order created"},
            )
            return

        if previous_status == self.status:
            return

        previous_display = dict(self.STATUS_CHOICES).get(previous_status, previous_status or "")
        current_display = self.get_status_display()
        notes = f"Status changed from {previous_display} to {current_display}".strip()

        OrderStatusUpdate.objects.create(
            order=self,
            status=self.status,
            notes=notes,
        )

        if self.status not in self.EMAIL_EXCLUDED_STATUS_NOTIFICATIONS:
            try:
                from .email_service import send_order_status_email

                send_order_status_email(
                    self,
                    previous_status=previous_status,
                    notes=notes,
                )
            except Exception as exc:
                logger.exception("Failed to send order status email for order %s: %s", self.pk, exc)






class OrderItem(models.Model):
    RETURN_STATUS = (
        ('none',      'No Return'),
        ('initiated', 'Return Initiated'),
        ('returned',  'Returned'),
    )

    order        = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product      = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='order_items')
    quantity     = models.PositiveIntegerField(default=1)
    product_name = models.CharField(max_length=255)
    sku_code = models.CharField(max_length=500) 
    unit_price     = models.DecimalField(max_digits=10, decimal_places=2)
    total          = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amt   = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    weight       = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, blank=True)
    length       = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, blank=True)
    width        = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, blank=True)
    height       = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, blank=True)

    
    # Return tracking at item level
    return_status = models.CharField(max_length=20, choices=RETURN_STATUS, default='none')
    is_returned   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True,null=True,blank=True)


    is_cancelled = models.BooleanField(default=False)
    cancel_notes = models.TextField(blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,null=True, blank=True,related_name='cancelled_orders')

    weight = models.DecimalField(max_digits=10, decimal_places=2,default=0.00,help_text="Weight in LBS")
    length = models.DecimalField(max_digits=10, decimal_places=2,default=0.00,help_text="Length in IN")
    width = models.DecimalField(max_digits=10, decimal_places=2,default=0.00,help_text="Width in IN")
    height = models.DecimalField(max_digits=10, decimal_places=2,default=0.00,help_text="Height in IN")

    def __str__(self):
        return f"Item #{self.id} - {self.product.name} (Order #{self.order.id})"
    

    @property
    def product_sku(self):
        return self.sku_code
    

    def cancel_by_whom(self):
        if self.cancelled_by:
            return self.cancelled_by.email
        return "Unknown"
    
    @property
    def is_returnable(self):
        if self.return_status != 'none' or self.is_returned:
            return False
        return self.shipments.filter(shipment_type='outbound',status='delivered').exists()
    
  

    @property
    def status(self) -> str:
        # Check return shipment first 
        return_shipment = self.shipments.filter(shipment_type='return').order_by('-created_at').first()

        if return_shipment:
            return f"return_{return_shipment.status}"


        # Then check outbound 
        outbound = self.shipments.filter(
            shipment_type='outbound'
        ).order_by('-created_at').first()

        if not outbound:
            return None  # No shipment info yet

        return outbound.status
    

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"
    




class OrderVariants(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_variants')
    order_item =  models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='orderItems_variants')
    variant_option_name = models.CharField(max_length=255)
    variant_option = models.ForeignKey(VariantOption, on_delete=models.CASCADE)

    def __str__(self):
        return f"Order - {self.order.id} - Variant Option - {self.variant_option_id}"


class OrderStatusUpdate(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_updates")
    status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    notes = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Order {self.order.id} status {self.status}"




class Shipment(models.Model):
    SHIPMENT_TYPE = (
        ('outbound', 'Outbound'),
        ('return',   'Return'),
    )

    STATUS_CHOICES = (
        ('label_created', 'Label Created'),
        ('picked_up',     'Picked Up'),
        ('in_transit',    'In Transit'),
        ('delivered',     'Delivered'),
        ('returned',      'Returned'),
        ('cancelled',     'Cancelled'),
    )

    # Core
    order         = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='shipments')
    shipment_type = models.CharField(max_length=10, choices=SHIPMENT_TYPE, default='outbound')
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='label_created')

    # Items in this shipment
    items = models.ManyToManyField(OrderItem, related_name='shipments', blank=True)

    # UPS Details
    tracking_number     = models.CharField(max_length=30, blank=True, null=True)
    shipment_id         = models.CharField(max_length=30, blank=True, null=True)
    carrier             = models.CharField(max_length=10, default='UPS')
    ups_transaction_ref = models.CharField(max_length=50, blank=True, null=True)
    shipping_label      = models.ImageField(upload_to='shipping_labels/', blank=True, null=True)
    label_created_at    = models.DateTimeField(blank=True, null=True)

    # Return specific
    return_reason       = models.TextField(blank=True, null=True)
    return_initiated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,null=True, blank=True,related_name='initiated_returns')
    return_initiated_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_shipment_type_display()} Shipment #{self.id} - Order #{self.order.id}"

    @property
    def is_return(self):
        return self.shipment_type == 'return'

    @property
    def item_count(self):
        return self.items.count()
