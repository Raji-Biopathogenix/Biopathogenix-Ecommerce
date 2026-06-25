# ups_tracking/tasks.py

import logging

from celery import shared_task, group

# from .ups_client import fetch_ups_tracking
from cart.services import UPSService
from .ups_mapper import map_ups_status, parse_ups_datetime, InternalStatus,get_latest_activity

logger = logging.getLogger(__name__)

ups = UPSService()

# Statuses that mean the order is still moving — we keep polling these
ACTIVE_STATUSES = [
    InternalStatus.PENDING,
    InternalStatus.CONFIRMED,
    InternalStatus.PROCESSING,
    InternalStatus.SHIPPED,
    InternalStatus.OUT_FOR_DELIVERY,
    InternalStatus.FAILED_DELIVERY,  # retry after a failed attempt
]

# Notify customer when order reaches one of these statuses
NOTIFY_ON_STATUSES = {
    InternalStatus.SHIPPED,
    InternalStatus.OUT_FOR_DELIVERY,
    InternalStatus.DELIVERED,
    InternalStatus.FAILED_DELIVERY,
}

ACTIVE_STATUSES = [
    'label_created',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'failed_delivery',
]


# Task 1 — Runs every 30 minutes via Celery Beat
@shared_task(name="order.poll_all_active_orders")
def poll_all_active_orders():
    """
    Fetch every active order that has a tracking number
    and fan out one track_single_order task per order.
    """
    # Import inside task to avoid circular error on module load
    from .models import Shipment  # replace with your actual app/model
        # status__in=ACTIVE_STATUSES,
        # tracking_number__isnull=False,

    active_shipments = Shipment.objects.filter(
        status__in       = ACTIVE_STATUSES,     
        tracking_number__isnull = False,        
    ).exclude(
        tracking_number  = ''
    ).values('id', 'tracking_number', 'status', 'order_id')

    print( "***" *10, "Polling UPS for active orders", "***" *10)
    print(f"[UPS Poll] Found {len(active_shipments)} active orders to sync.")
    print( "***" *10, "Polling UPS for active orders", "***" *10)

    if not active_shipments:
        logger.info("[UPS Poll] No active orders to sync.")
        return

    logger.info(f"[UPS Poll] Fanning out {len(active_shipments)} order(s)…")

    # Launch all per-order tasks in parallel as a Celery group
    job_group = group(
        track_single_shipment.s(
            shipment_id     = s['id'],
            tracking_number = s['tracking_number'],
            current_status  = s['status'],
            order_id        = s['order_id'],
        )
        for s in active_shipments
    )
    job_group.apply_async()


@shared_task(
    name="order.track_single_shipment",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def track_single_shipment(self,shipment_id, tracking_number, current_status, order_id):
    from order.models import Shipment, OrderItem
    from django.utils.timezone import now

    try:
        tracking_response = ups.track_shipment(tracking_number)
    except Exception as exc:
        logger.error(f"[UPS] API error for order {order_id}: {exc}")
        raise self.retry(exc=exc)

    if not tracking_response:
        logger.warning(f"[UPS] No data for order {order_id}")
        return

    # Map status using your actual response format
    new_status    = map_ups_status(tracking_response)
    latest        = get_latest_activity(tracking_response)
    ups_location  = latest.get("location", "") if latest else ""
    ups_desc      = latest.get("description", "") if latest else ""
    ups_time      = parse_ups_datetime(latest["date"], latest["time"]) if latest else None

    print(f"[UPS] Order {order_id}: {current_status} → {new_status}")
    print(f"[UPS] Last activity: {ups_desc} at {ups_location}")

    # Skip DB write if nothing changed
    if new_status == current_status:
        print(f"[UPS] Order {order_id} unchanged ({current_status})")
        return

    Shipment.objects.filter(id=shipment_id).update(
        status           = new_status,
        ups_last_location= ups_location,
        ups_last_event_at= ups_time,
        ups_last_synced_at= now(),
    )

    if new_status == 'delivered':
        shipment = Shipment.objects.get(id=shipment_id)
        shipment.items.update(status='delivered')
        print(f"[UPS] Items in shipment {shipment_id} marked delivered")

    shipment = Shipment.objects.get(id=shipment_id)
    shipment.save(update_fields=['status'])  # triggers signal

    print(f"Order {order_id} updated to {new_status}")

    # Notify customer on milestone statuses
    if new_status in NOTIFY_ON_STATUSES:
        notify_customer.delay(order_id, new_status)


# Task 3 — Customer notification (stub)
@shared_task(name="order.notify_customer")
def notify_customer(order_id: str, status: str):
    """
    Replace this stub with your email / SMS / push logic.
    e.g. send_order_status_email(order_id, status)
    """
    logger.info(f"[Notify] Order {order_id} status: {status}")




# test tracking numbers
# Order.objects.filter(id=1).update(tracking_number="1Z12345E1305277940")  # Label Created
# Order.objects.filter(id=2).update(tracking_number="1Z12345E6605272234")  # In Transit
# Order.objects.filter(id=3).update(tracking_number="1Z12345E0305271640")  # Out for Delivery
# Order.objects.filter(id=4).update(tracking_number="1Z12345E0205271688")  # Delivered
# Order.objects.filter(id=5).update(tracking_number="1Z12345E0195845808")  # Exception