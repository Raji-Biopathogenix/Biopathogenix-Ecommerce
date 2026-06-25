import base64
from django.core.files.base import ContentFile
from django.utils import timezone
from .models import Shipment, OrderItem


def _save_label(shipment: Shipment, ups_response: dict, prefix: str = "label"):
    label     = ups_response['ShipmentResponse']['ShipmentResults']['PackageResults']['ShippingLabel']
    gif_bytes = base64.b64decode(label['GraphicImage'])
    filename  = f"{prefix}_{shipment.tracking_number}.gif"
    shipment.shipping_label.save(filename, ContentFile(gif_bytes), save=True)



def _extract_ups_fields(ups_response: dict) -> dict:
    results  = ups_response['ShipmentResponse']['ShipmentResults']
    ref      = ups_response['ShipmentResponse']['Response']['TransactionReference']
    return {
        'tracking_number':     results.get('ShipmentIdentificationNumber'),
        'shipment_id':         results.get('ShipmentIdentificationNumber'),
        'carrier':             'UPS',
        'ups_transaction_ref': ref.get('TransactionIdentifier'),
        'label_created_at':    timezone.now(),
    }


def create_outbound_shipment(order, item_ids: list, ups_response: dict):
    
    try:
        # Validate items belong to this order
        items = OrderItem.objects.filter(id__in=item_ids, order=order)
        if items.count() != len(item_ids):
            return False, "Some items do not belong to this order"

        # Extract UPS fields
        ups_fields = _extract_ups_fields(ups_response)

        # Create Shipment
        shipment = Shipment.objects.create(
            order         = order,
            shipment_type = 'outbound',
            status        = 'label_created',
            **ups_fields,
        )

        # Attach items
        shipment.items.set(items)

        # Save label
        _save_label(shipment, ups_response, prefix="label")

        return True, shipment

    except Exception as e:
        return False, str(e)

def create_return_shipment(order, item_ids: list, ups_response: dict,admin_user, reason: str):
    try:
        # Validate items
        items = OrderItem.objects.filter(id__in=item_ids, order=order)

        if items.count() != len(item_ids):
            return False, "Some items do not belong to this order"

        # Check each item is returnable
        non_returnable = [item for item in items if not item.is_returnable]
        if non_returnable:
            names = [f"{item.product.name} (#{item.id})" for item in non_returnable]
            return False, f"These items cannot be returned: {', '.join(names)}"

        # Extract UPS fields
        ups_fields = _extract_ups_fields(ups_response)

        # Create Return Shipment
        shipment = Shipment.objects.create(
            order               = order,
            shipment_type       = 'return',
            status              = 'label_created',
            return_reason       = reason,
            return_initiated_by = admin_user,
            return_initiated_at = timezone.now(),
            **ups_fields,
        )

        # Attach selected items only
        shipment.items.set(items)

        # Mark items as return requested
        items.update(return_status='initiated')

        # Save return label
        _save_label(shipment, ups_response, prefix="return_label")

        return True, shipment

    except Exception as e:
        return False, str(e)
