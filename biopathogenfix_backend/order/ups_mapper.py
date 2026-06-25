from datetime import datetime, timezone

class InternalStatus:
    PENDING          = "pending"
    CONFIRMED        = "confirmed"
    PROCESSING       = "processing"
    SHIPPED          = "shipped"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED        = "delivered"
    FAILED_DELIVERY  = "failed_delivery"
    CANCELLED        = "cancelled"


# Map UPS status_code → internal status
# Based on your actual API response format
UPS_CODE_MAP = {
    "001": InternalStatus.DELIVERED,        # Delivered
    "002": InternalStatus.OUT_FOR_DELIVERY, # Out for delivery
    "003": InternalStatus.SHIPPED,          # Picked up
    "004": InternalStatus.PROCESSING,       # In transit
    "005": InternalStatus.PROCESSING,       # On the Way / In transit
    "006": InternalStatus.FAILED_DELIVERY,  # Delivery attempt failed
    "007": InternalStatus.FAILED_DELIVERY,  # Exception
    "008": InternalStatus.CONFIRMED,        # Label created
    "010": InternalStatus.FAILED_DELIVERY,  # Return to sender
}

# Map UPS status description → internal status (fallback)
UPS_DESCRIPTION_MAP = {
    "delivered":                     InternalStatus.DELIVERED,
    "out for delivery":              InternalStatus.OUT_FOR_DELIVERY,
    "on the way":                    InternalStatus.PROCESSING,
    "arrived at facility":           InternalStatus.PROCESSING,
    "departed from facility":        InternalStatus.PROCESSING,
    "picked up":                     InternalStatus.SHIPPED,
    "shipper created a label":       InternalStatus.CONFIRMED,
    "ups has not received":          InternalStatus.CONFIRMED,
    "delivery attempt":              InternalStatus.FAILED_DELIVERY,
    "exception":                     InternalStatus.FAILED_DELIVERY,
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

    return InternalStatus.PROCESSING  # default fallback


def get_latest_activity(tracking_response: dict) -> dict | None:
    activities = tracking_response.get("activity", [])
    return activities[0] if activities else None


def parse_ups_datetime(date_str: str, time_str: str):
    dt_str = f"{date_str}{time_str}"
    return datetime.strptime(dt_str, "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)