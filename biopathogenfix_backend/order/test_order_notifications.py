from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.core import mail
from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from order import email_service
from order.packing_slips import PackingSlipView, address_lines, render_packing_slip


def sample_order():
    user = SimpleNamespace(email='customer@example.com', first_name='Jennifer', last_name='Wilkerson',
        Company_name='Example Laboratory', laboratory=None, laboratory_id=None)
    item = SimpleNamespace(product_name='Amies Transport Media Tube w/ STD & Mini Swab Kit - Pack of 50',
        sku_code='CS-10104-PK', quantity=1, total=Decimal('60'), unit_price=Decimal('60'),
        product=None, orderItems_variants=MagicMock())
    item.orderItems_variants.all.return_value = [SimpleNamespace(
        variant_option=SimpleNamespace(variant=SimpleNamespace(name='Pack Size')),
        variant_option_name='Pack of 50')]
    order = SimpleNamespace(id=9033, user=user, created_at=datetime(2026, 9, 18, 16, tzinfo=timezone.utc),
        subtotal=Decimal('60'), shipping_cost=Decimal('20'), tax_amount=Decimal('4.80'),
        coupon_amt=Decimal('0'), amount=Decimal('84.80'), payment_method='card',
        card_brand='Mastercard', card_last4='3976', shipping_first_name='Jennifer', shipping_last_name='Wilkerson',
        shipping_address_line1='111 Example Lane', shipping_address_line2='Suite 1',
        shipping_city='Louisville', shipping_state='Kentucky', shipping_state_code='KY',
        shipping_postal_code='40207', shipping_country='US', shipping_email='customer@example.com',
        shipping_phone='555-0100', billing_first_name='Jennifer', billing_last_name='Wilkerson',
        billing_address_line1='111 Example Lane', billing_city='Louisville', billing_state='Kentucky',
        billing_state_code='KY', billing_postal_code='40207', billing_country='US', items=MagicMock())
    order.items.select_related.return_value.prefetch_related.return_value = [item]
    order.items.prefetch_related.return_value.all.return_value = [item]
    return order


@override_settings(ORDER_NOTIFICATION_BCC=['scope@biopathogenix.com', 'rajeswari.gopu@biopathogenix.com', 'order@biopathogenix.com'],
                   PACKING_SLIP_COMPANY_ADDRESS='3004 Park Central Ave\nNicholasville, KY 40356',
                   EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class OrderNotificationTests(SimpleTestCase):
    @override_settings(GRAPH_ENABLED=True)
    def test_graph_sends_distinct_customer_and_bcc_only_internal_bodies(self):
        with patch.object(email_service, 'send_graph_email') as send, \
                patch.object(email_service, '_get_related_products', return_value=[]):
            email_service.send_order_confirmation_emails(sample_order())
        self.assertEqual(send.call_count, 2)
        customer, internal = send.call_args_list
        self.assertEqual(customer.args[0], ['customer@example.com'])
        self.assertEqual(customer.kwargs['bcc_list'], [])
        self.assertNotIn('/packing-slip', customer.kwargs['html_body'])
        self.assertNotIn('/packing-slip', customer.kwargs['text_body'])
        self.assertEqual(internal.args[0], [])
        self.assertEqual(internal.kwargs['bcc_list'], ['scope@biopathogenix.com', 'rajeswari.gopu@biopathogenix.com', 'order@biopathogenix.com'])
        self.assertNotIn('cc_list', internal.kwargs)
        self.assertIn('/orders/9033/edit', internal.kwargs['html_body'])
        self.assertIn('/orders/9033/edit', internal.kwargs['text_body'])
        self.assertNotIn('/orders/9033/edit', customer.kwargs['html_body'])
        self.assertIn('3004 Park Central Ave', internal.kwargs['html_body'])
        self.assertNotIn('120 Dewey', internal.kwargs['html_body'])
        self.assertIn('3976', internal.kwargs['html_body'])

    @override_settings(GRAPH_ENABLED=False)
    def test_smtp_keeps_internal_content_out_of_customer_copy(self):
        with patch.object(email_service, '_get_related_products', return_value=[]):
            email_service.send_order_confirmation_emails(sample_order())
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(mail.outbox[0].bcc, [])
        self.assertEqual(mail.outbox[1].to, [])
        self.assertIn('order@biopathogenix.com', mail.outbox[1].bcc)
        self.assertNotIn('/packing-slip', mail.outbox[0].alternatives[0].content)
        self.assertIn('/orders/9033/edit', mail.outbox[1].alternatives[0].content)

    @override_settings(GRAPH_ENABLED=True)
    def test_internal_delivery_still_attempted_if_customer_delivery_fails(self):
        with patch.object(email_service, '_get_related_products', return_value=[]), \
                patch.object(email_service, 'send_graph_email', side_effect=[RuntimeError('test failure'), None]) as send, \
                self.assertLogs(email_service.logger, level='ERROR'):
            email_service.send_order_confirmation_emails(sample_order())
        self.assertEqual(send.call_count, 2)

    @override_settings(GRAPH_ENABLED=True)
    def test_status_update_has_no_internal_bcc(self):
        order = sample_order()
        order.fullName = 'Jennifer Wilkerson'
        order.STATUS_CHOICES = [('confirmed', 'Confirmed'), ('processing', 'Processing')]
        order.status = 'processing'
        order.get_status_display = lambda: 'Processing'
        order.tracking_number = ''
        with patch.object(email_service, '_get_related_products', return_value=[]), \
                patch.object(email_service, 'send_graph_email') as send:
            self.assertTrue(email_service.send_order_status_email(order, 'confirmed'))
        self.assertEqual(send.call_args.kwargs['bcc_list'], [])
        self.assertNotIn('/packing-slip', send.call_args.kwargs['html_body'])

    def test_pdf_and_multipage_orders(self):
        order = sample_order()
        result = render_packing_slip(order)
        self.assertTrue(result.startswith(b'%PDF'))
        item = order.items.prefetch_related.return_value.all.return_value[0]
        order.items.prefetch_related.return_value.all.return_value = [item] * 80
        result = render_packing_slip(order)
        import re
        self.assertGreater(len(re.findall(rb'/Type /Page\b', result)), 1)

    def test_customer_cannot_fetch_packing_slip_even_for_their_own_order(self):
        request = APIRequestFactory().get('/packing-slip/')
        user = SimpleNamespace(is_authenticated=True, is_active=True, is_staff=False, is_superuser=False)
        force_authenticate(request, user=user)
        with patch('order.permissions.UserRole.objects.filter') as roles, \
                patch('order.packing_slips.get_object_or_404') as lookup:
            roles.return_value.exists.return_value = False
            self.assertEqual(PackingSlipView(request, order_id=9033).status_code, 403)
            lookup.assert_not_called()

    def test_anonymous_cannot_fetch_packing_slip(self):
        response = PackingSlipView(APIRequestFactory().get('/packing-slip/'), order_id=9033)
        self.assertIn(response.status_code, (401, 403))

    def test_staff_receives_private_pdf(self):
        request = APIRequestFactory().get('/packing-slip/')
        user = SimpleNamespace(pk=7, is_authenticated=True, is_active=True, is_staff=True, is_superuser=False)
        force_authenticate(request, user=user)
        with patch('order.packing_slips.get_object_or_404', return_value=sample_order()):
            result = PackingSlipView(request, order_id=9033)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result['Content-Type'], 'application/pdf')
        self.assertEqual(result['Cache-Control'], 'private, no-store')

    def test_country_id_is_resolved_for_printed_address(self):
        order = sample_order()
        order.shipping_country = '1'
        with patch('order.packing_slips.Country.objects.filter') as countries:
            countries.return_value.values_list.return_value.first.return_value = 'United States'
            lines = address_lines(order)
        self.assertIn('United States', lines)
        self.assertNotIn('1', lines)
