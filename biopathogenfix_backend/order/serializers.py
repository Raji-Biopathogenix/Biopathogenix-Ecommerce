from rest_framework import serializers

from .models import Order, OrderItem, OrderStatusUpdate,Shipment


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('__all__')


class OrderItemSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    def get_status(self, obj):
        return obj.status

    class Meta:
        model = OrderItem
        fields = ("product_name", "quantity", "unit_price", "total", "status", "is_cancelled")


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusUpdate
        fields = ("status", "notes", "created_at")


class UserShipmentSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    tracking_url = serializers.SerializerMethodField()

    def get_items(self, obj):
        return [{"product_name": i.product_name, "quantity": i.quantity} for i in obj.items.all()]

    def get_tracking_url(self, obj):
        if obj.tracking_number:
            return f"https://www.ups.com/track?tracknum={obj.tracking_number}&requester=ST/trackdetails"
        return None

    class Meta:
        model = Shipment
        fields = ("id", "tracking_number", "tracking_url", "status", "carrier", "shipment_type", "items")


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_updates = OrderStatusUpdateSerializer(many=True, read_only=True)
    shipments = serializers.SerializerMethodField()
    order_number = serializers.SerializerMethodField()
    shipping_summary = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    payment_method_display = serializers.SerializerMethodField()
    ups_tracking_url = serializers.SerializerMethodField()

    def get_shipments(self, obj):
        outbound = obj.shipments.filter(shipment_type="outbound").prefetch_related("items")
        return UserShipmentSerializer(outbound, many=True).data

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "transaction_id",
            "amount",
            "status",
            "tracking_number",
            "created_at",
            "items",
            "shipments",
            "status_updates",
            "shipping_summary",
            "customer_name",
            "customer_email",
            "payment_method",
            "payment_method_display",
            "ups_tracking_url"
        )

    def get_order_number(self, obj):
        return f"ORD-{obj.id:06d}"
    
    def get_ups_tracking_url(self, obj):
        if obj.tracking_number:
            return f"https://www.ups.com/track?tracknum={obj.tracking_number}&requester=ST/trackdetails"
        return None

    def get_shipping_summary(self, obj):
        parts = [
            f"{obj.shipping_first_name} {obj.shipping_last_name}".strip(),
            obj.shipping_address_line1,
            obj.shipping_city,
            obj.shipping_state,
            obj.shipping_postal_code,
            obj.shipping_country,
        ]
        return ", ".join(part for part in parts if part)

    def get_customer_name(self, obj):
        name_parts = [obj.shipping_first_name, obj.shipping_last_name]
        full_name = " ".join(part for part in name_parts if part).strip()
        if full_name:
            return full_name
        user_full_name = getattr(obj.user, "get_full_name", None)
        if callable(user_full_name):
            user_full_name = user_full_name()
        return user_full_name or obj.user.email

    def get_customer_email(self, obj):
        return obj.shipping_email or obj.user.email

    def get_payment_method_display(self, obj):
        mapping = {
            "card": "Card Payment",
            "invoice": "Invoice Payment",
        }
        return mapping.get(obj.payment_method.lower(), obj.payment_method.title())


class AllOrderSerializer(serializers.ModelSerializer):
    payment_method_display = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    ups_tracking_url = serializers.SerializerMethodField()


    class Meta:
        model = Order
        fields = [
                "id",
                "transaction_id",
                "amount",
                "status",
                "payment_method",
                "payment_method_display",
                "shipping_address_line1",
                "card_last4",
                "card_brand",
                "card_name",
                "customer",
                'email',
                'created_at',
                'amount',
                "items_count",
                "return_requested_reason",
                "tracking_number",
                "shipment_id",
                "ups_tracking_url",
                "shipping_label",
                "is_cancellable",
                "is_refundable",
        ]
    def get_items_count(self,obj):
        return  obj.items.count() 

    
    def get_email(Self,obj):
        return obj.user.email
    
    def get_ups_tracking_url(self, obj):
        if obj.tracking_number:
            return f"https://www.ups.com/track?tracknum={obj.tracking_number}&requester=ST/trackdetails"
        return None

    
    


    def get_payment_method_display(self, obj):
        mapping = {
            "card": "Card Payment",
            "invoice": "Invoice Payment",
        }
        return mapping.get(obj.payment_method.lower(), obj.payment_method.title())

    def get_customer(self, obj):
        name_parts = [obj.shipping_first_name, obj.shipping_last_name]
        full_name = " ".join(part for part in name_parts if part).strip()
        if full_name:
            return full_name
        user_full_name = getattr(obj.user, "get_full_name", None)
        if callable(user_full_name):
            user_full_name = user_full_name()
        return user_full_name or obj.user.email
    




class ShipmentItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_name",
            "product_sku",
            "quantity",
            "return_status",
            "is_returned",
            "is_returnable",
            "status",
            "is_cancelled",
            "cancel_notes",
            "cancel_by_whom",   
        ]




class ShipmentSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()
    items = ShipmentItemSerializer(many=True, read_only=True)

    class Meta:
        model = Shipment
        fields = [
            "id",
            "order",
            "shipment_type",
            "status",
            "items",
            "tracking_number",
            "shipment_id",
            "carrier",
            "item_count",
            "shipping_label",
            "return_reason",
            "return_initiated_by",
            "return_initiated_at"
        ]

    def get_item_count(self, obj):
        return obj.items.count()

    def get_items(self, obj):
        return ShipmentItemSerializer(obj.items.all(), many=True).data


class ShipmentOrderSerailizer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    outbound_shipments = serializers.SerializerMethodField()
    return_shipments = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
                "id",
                "transaction_id",
                "payment_method",
                "status",
                "customer_name",
                'created_at',
                'items',
                'outbound_shipments',
                'return_shipments',
                
            ]

    def get_items(self, obj):
        orderItems = obj.items.all()
        if orderItems and len(orderItems) > 0:
            return ShipmentItemSerializer(orderItems,many=True).data
        return None
    
    def get_outbound_shipments(self, obj):
        qs = [s for s in obj.shipments.all() if s.shipment_type == 'outbound']
        request = self.context.get("request")
        return ShipmentSerializer(qs, many=True, context={'request': request}).data

    def get_return_shipments(self, obj):
        qs = [s for s in obj.shipments.all() if s.shipment_type == 'return']
        request = self.context.get("request")
        return ShipmentSerializer(qs, many=True, context={'request': request}).data

    def get_customer_name(self, obj):
        name_parts = [obj.shipping_first_name, obj.shipping_last_name]
        full_name = " ".join(part for part in name_parts if part).strip()
        if full_name:
            return full_name
        user_full_name = getattr(obj.user, "get_full_name", None)
        if callable(user_full_name):
            user_full_name = user_full_name()
        return user_full_name or obj.user.email
 


class FetchOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['quantity','product_name','unit_price','total','id','sku_code']


class CancelOrderSerializer(serializers.Serializer):
    cancel_notes = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500
    )





class RefundOrderSerializer(serializers.Serializer):
    refund_amount = serializers.DecimalField(max_digits=10,decimal_places=2,min_value=0.01)
    refund_notes     = serializers.CharField(required=False,allow_blank=True,max_length=500)
    refund_reference = serializers.CharField(required=False,allow_blank=True,max_length=100,help_text="Payment gateway reference / transaction ID"
    )

    def validate_refund_amount(self, value):
        order = self.context.get('order')
        if order and value > order.amount:
            raise serializers.ValidationError(f"Refund amount cannot exceed order total of ${order.amount}")
        return value
