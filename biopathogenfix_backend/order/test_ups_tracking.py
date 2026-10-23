from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings

from order import tasks
from order.models import Order, Shipment


def ups_response(code, description):
    return {
        "tracking_number": "1ZTEST",
        "status": description,
        "status_code": code,
        "activity": [{"date": "20261023", "time": "101500", "location": "Louisville", "description": description}],
    }


@override_settings(GRAPH_ENABLED=False, EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class UpsTrackingTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create(email='customer@example.test', is_active=True)
        self.order = Order.objects.create(user=self.user, transaction_id='charge', status='processing',
            amount=Decimal('20'), paymet_status='success', payment_method='card')
        self.shipment = Shipment.objects.create(order=self.order, tracking_number='1ZTEST', status='label_created')

    def track(self, response):
        with patch.object(tasks.ups, 'track_shipment', return_value=response), \
                patch.object(tasks.notify_customer, 'delay'):
            tasks.track_single_shipment.apply(kwargs=dict(
                shipment_id=self.shipment.id, tracking_number='1ZTEST',
                current_status=self.shipment.status, order_id=self.order.id)).get()
        self.shipment.refresh_from_db()
        self.order.refresh_from_db()

    def test_in_transit_update_marks_order_shipped_and_emails_only_the_customer(self):
        self.track(ups_response('005', 'On the Way'))
        self.assertEqual(self.shipment.status, 'in_transit')
        self.assertEqual(self.order.status, 'shipped')
        self.assertEqual(self.order.ups_last_location, 'Louisville')
        self.assertIsNotNone(self.order.ups_last_synced_at)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['customer@example.test'])

    def test_delivered_update_marks_order_delivered(self):
        self.track(ups_response('011', 'Delivered'))
        self.assertEqual(self.shipment.status, 'delivered')
        self.assertEqual(self.order.status, 'delivered')
        self.assertEqual(len(mail.outbox), 1)

    def test_unchanged_status_sends_nothing(self):
        self.track(ups_response('', 'Shipper created a label, UPS has not received the package yet.'))
        self.assertEqual(self.shipment.status, 'label_created')
        self.assertIsNotNone(self.order.ups_last_synced_at)
        self.assertEqual(len(mail.outbox), 0)

    def test_poll_runs_every_30_minutes(self):
        from django.conf import settings
        schedule = settings.CELERY_BEAT_SCHEDULE['ups-poll-every-30-min']
        self.assertEqual(schedule['task'], 'order.poll_all_active_orders')
        self.assertEqual(schedule['schedule']._orig_minute, '*/30')
