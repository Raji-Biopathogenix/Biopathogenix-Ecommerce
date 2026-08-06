from django.core.management.base import BaseCommand

from order.models import Shipment, Order

# Before this fix, map_ups_status() wrote order-level vocabulary
# (pending/confirmed/processing/shipped/out_for_delivery/failed_delivery)
# straight into Shipment.status, which only accepts
# label_created/picked_up/in_transit/delivered/returned/cancelled.
# This normalizes any shipment rows that got one of the old invalid values.
LEGACY_VALUE_MAP = {
    "pending":          "label_created",
    "confirmed":        "label_created",
    "processing":       "in_transit",
    "shipped":          "picked_up",
    "out_for_delivery": "in_transit",
    "failed_delivery":  "in_transit",
}


class Command(BaseCommand):
    help = "One-time fix: normalize Shipment.status values written with the old (incorrect) vocabulary, then recompute affected orders' status."

    def handle(self, *args, **options):
        fixed = 0
        affected_order_ids = set()

        for old_value, new_value in LEGACY_VALUE_MAP.items():
            qs = Shipment.objects.filter(status=old_value)
            count = qs.count()
            if not count:
                continue
            affected_order_ids.update(qs.values_list("order_id", flat=True))
            qs.update(status=new_value)
            fixed += count
            self.stdout.write(f"Shipment.status '{old_value}' -> '{new_value}': {count} row(s)")

        self.stdout.write(f"Total shipments fixed: {fixed}")

        recomputed = 0
        for order in Order.objects.filter(id__in=affected_order_ids):
            before = order.status
            order.update_status()
            order.refresh_from_db(fields=["status"])
            if order.status != before:
                recomputed += 1
                self.stdout.write(f"Order #{order.id}: '{before}' -> '{order.status}'")

        self.stdout.write(f"Orders recomputed with a status change: {recomputed} / {len(affected_order_ids)} affected")
