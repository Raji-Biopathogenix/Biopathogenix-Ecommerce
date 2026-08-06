from datetime import datetime, timezone

# These must match order.models.Shipment.STATUS_CHOICES exactly -- map_ups_status()
# writes straight into Shipment.status, and Order.update_status() filters on these
# same literal strings ('picked_up', 'in_transit', 'delivered') to decide whether an
# order counts as shipped/delivered. A mismatched vocabulary here means shipments
# silently get an invalid status value: the shipment-stage UI never advances past
# "Label Created" and the order status skips straight from "processing" to "delivered".
class InternalStatus:
    LABEL_CREATED = "label_created"
    PICKED_UP     = "picked_up"
    IN_TRANSIT    = "in_transit"
    DELIVERED     = "delivered"


# Map UPS status_code → Shipment status
# Based on your actual API response format
UPS_CODE_MAP = {
    "001": InternalStatus.DELIVERED,      # Delivered
    "002": InternalStatus.IN_TRANSIT,     # Out for delivery
    "003": InternalStatus.PICKED_UP,      # Picked up
    "004": InternalStatus.IN_TRANSIT,     # In transit
    "005": InternalStatus.IN_TRANSIT,     # On the Way / In transit
    "006": InternalStatus.IN_TRANSIT,     # Delivery attempt failed -- keep polling
    "007": InternalStatus.IN_TRANSIT,     # Exception -- keep polling
    "008": InternalStatus.LABEL_CREATED,  # Label created
    "010": InternalStatus.IN_TRANSIT,     # Return to sender -- keep polling
}

# Map UPS status description → Shipment status (fallback)
UPS_DESCRIPTION_MAP = {
    "delivered":                     InternalStatus.DELIVERED,
    "out for delivery":              InternalStatus.IN_TRANSIT,
    "on the way":                    InternalStatus.IN_TRANSIT,
    "arrived at facility":           InternalStatus.IN_TRANSIT,
    "departed from facility":        InternalStatus.IN_TRANSIT,
    "picked up":                     InternalStatus.PICKED_UP,
    "shipper created a label":       InternalStatus.LABEL_CREATED,
    "ups has not received":          InternalStatus.LABEL_CREATED,
    "delivery attempt":              InternalStatus.IN_TRANSIT,
    "exception":                     InternalStatus.IN_TRANSIT,
}


def map_ups_status(tracking_response: dict) -> str:
    # Try status_code first
    status_code = tracking_response.get("status_code", "")
    if status_code in UPS_CODE_MAP:
        return UPS_CODE_MAP[status_code]

    # Fall back to description matching
    status_desc = tracking_response.get("status", "").lower()
    for key, value in UPS_DESCRIPTION_MAP.items():
        if key in status_desc:
            return value

    return InternalStatus.IN_TRANSIT  # default fallback


def get_latest_activity(tracking_response: dict) -> dict | None:
    activities = tracking_response.get("activity", [])
    return activities[0] if activities else None


def parse_ups_datetime(date_str: str, time_str: str):
    dt_str = f"{date_str}{time_str}"
    return datetime.strptime(dt_str, "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)