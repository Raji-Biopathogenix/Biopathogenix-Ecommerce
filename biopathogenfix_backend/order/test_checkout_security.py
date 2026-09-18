from datetime import date, timedelta
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.http import Http404
from django.db.models import QuerySet
from django.test import SimpleTestCase
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, force_authenticate

from biopathproj.urls import cached_media_serve
from order import pricing, views
from order.permissions import accessible_orders, is_order_admin


class CheckoutSecurityTests(SimpleTestCase):
    def setUp(self):
        self.user = SimpleNamespace(id=7, pk=7, is_authenticated=True, is_active=True,
                                    is_staff=False, is_superuser=False, laboratory_id=None)
        self.factory = APIRequestFactory()
        self.quote = dict(amount=Decimal('116'), subtotal=Decimal('100'),
                          shipping_cost=Decimal('20'), tax_amount=Decimal('6'),
                          tax_rate=Decimal('.06'), coupon_amt=Decimal('10'),
                          coupon_code='SAVE', coupon_val=Decimal('10'), coupon_type='fixed')

    def request(self, amount='116', method='invoice'):
        address = dict(first_name='Test', last_name='Customer', email='test@example.com',
                       address_line1='1 Main St', city='Lexington', state='KY',
                       postal_code='40502', country='US')
        data = dict(amount=amount, payment_method=method, idempotency_key='test-key',
                    shipping=address, useSameAddress=True,
                    subtotal='1', tax_amount='0', shipping_cost='0')
        if method == 'card':
            data.update(card_name='Test', card_number='test-only', card_exp_month='12',
                        card_exp_year='2030', card_cvv='test-only')
        req = self.factory.post('/checkout/', data, format='json')
        force_authenticate(req, user=self.user)
        return req

    def test_both_payment_flows_receive_only_server_totals(self):
        for method in ('card', 'invoice'):
            with self.subTest(method=method), patch.object(views.Order.objects, 'filter') as orders, \
                    patch.object(views.Cart.objects, 'filter'), \
                    patch.object(pricing, 'checkout_quote', return_value=self.quote), \
                    patch.object(views, f'_handle_{method}_payment', return_value=Response({'status': 'success'})) as pay:
                orders.return_value.first.return_value = None
                response = views.CheckoutView(self.request(method=method))
                self.assertEqual(response.status_code, 200)
                self.assertEqual(pay.call_args.args[3], Decimal('116'))
                for field in ('subtotal', 'shipping_cost', 'tax_amount', 'coupon_amt'):
                    self.assertEqual(pay.call_args.args[1][field], self.quote[field])

    def test_changed_total_never_calls_payment(self):
        with patch.object(views.Order.objects, 'filter') as orders, \
                patch.object(views.Cart.objects, 'filter'), \
                patch.object(pricing, 'checkout_quote', return_value=self.quote), \
                patch.object(views, '_handle_card_payment') as pay:
            orders.return_value.first.return_value = None
            response = views.CheckoutView(self.request('100', 'card'))
            self.assertEqual(response.status_code, 409)
            self.assertEqual(response.data['quote']['amount'], Decimal('116'))
            pay.assert_not_called()

    def test_completed_retry_does_not_require_cart_or_card_fields(self):
        req = self.factory.post('/checkout/', {'idempotency_key': 'test-key'}, format='json')
        force_authenticate(req, user=self.user)
        with patch.object(views.Order.objects, 'filter') as orders, \
                patch.object(views.Cart.objects, 'filter'), patch.object(pricing, 'checkout_quote') as quote:
            orders.return_value.first.return_value = SimpleNamespace(
                user_id=7, id=12, amount=Decimal('116'), transaction_id='test')
            self.assertEqual(views.CheckoutView(req).status_code, 200)
            quote.assert_not_called()

    def test_other_users_retry_key_does_not_disclose_order(self):
        with patch.object(views.Order.objects, 'filter') as orders, patch.object(views.Cart.objects, 'filter'):
            orders.return_value.first.return_value = SimpleNamespace(user_id=99)
            result = views.CheckoutView(self.request())
            self.assertEqual(result.status_code, 409)
            self.assertNotIn('transaction_id', result.data)

    def test_nonfinite_amounts_rejected(self):
        for amount in ('NaN', 'Infinity', '-1'):
            with self.subTest(amount=amount), self.assertRaises(ValueError):
                pricing.money(amount)

    def test_catalog_replaces_tampered_cart_and_checks_stock(self):
        product = SimpleNamespace(is_active=True, is_customizable=False, discount_value=10)
        sku = SimpleNamespace(price=Decimal('100'), stock=5)
        item = MagicMock(product=product, sku_code='REAL', quantity=2, price=Decimal('.01'),
                         total_price=Decimal('.02'))
        with patch.object(pricing.ProductSKU.objects, 'filter') as skus:
            skus.return_value.first.return_value = sku
            self.assertEqual(pricing.price_items([item], self.user), Decimal('180'))
            self.assertEqual(item.price, Decimal('90'))
            item.quantity = 6
            with self.assertRaises(ValueError):
                pricing.price_items([item], self.user)

    def test_customer_price_is_loaded_from_database(self):
        self.user.laboratory_id = 3
        with patch.object(pricing.CustomizableProductprices.objects, 'filter') as prices:
            prices.return_value.first.return_value = SimpleNamespace(price=Decimal('80'))
            base, price = pricing.catalog_price(
                SimpleNamespace(is_customizable=True, discount_value=10),
                SimpleNamespace(price=Decimal('100')), self.user)
            self.assertEqual((base, price), (Decimal('80'), Decimal('72')))

    def test_coupon_discount_and_expiry(self):
        coupon = SimpleNamespace(code='SAVE', is_active=True, status='active',
            start_date=date.today()-timedelta(days=1), end_date=date.today()+timedelta(days=1),
            min_price=0, max_price=None, total_count=10, used_count=0, per_user_limit=1,
            discount_value=Decimal('10'), discount_type='percentage')
        with patch.object(pricing.Coupon.objects, 'filter') as coupons, \
                patch.object(pricing.Order.objects, 'filter') as orders:
            coupons.return_value.first.return_value = coupon
            orders.return_value.count.return_value = 0
            orders.return_value.filter.return_value.count.return_value = 0
            items = [MagicMock(coupon_code='SAVE')]
            self.assertEqual(pricing.coupon_discount(items, self.user, Decimal('100'))[1], Decimal('10'))
            orders.return_value.filter.return_value.count.return_value = 1
            with self.assertRaises(ValueError):
                pricing.coupon_discount(items, self.user, Decimal('100'))
            coupon.end_date = date.today()-timedelta(days=1)
            with self.assertRaises(ValueError):
                pricing.coupon_discount(items, self.user, Decimal('100'))

    def test_full_quote_includes_valid_coupon_shipping_and_tax(self):
        with patch.object(pricing, 'price_items', return_value=Decimal('100')), \
                patch.object(pricing, 'coupon_discount', return_value=(None, Decimal('10'))), \
                patch.object(pricing, 'shipping_quote', return_value=Decimal('20')), \
                patch.object(pricing, 'calculate_tax_and_shipping', return_value={'tax_amount': 6, 'tax_rate': .06}) as tax:
            quote = pricing.checkout_quote([SimpleNamespace(quantity=1)], self.user, {'country': 'US', 'state': 'KY'})
            self.assertEqual(quote['amount'], Decimal('116'))
            self.assertEqual(tax.call_args.kwargs['shipping_cost'], Decimal('20'))

    def test_provider_failure_never_calls_payment(self):
        with patch.object(views.Order.objects, 'filter') as orders, patch.object(views.Cart.objects, 'filter'), \
                patch.object(pricing, 'checkout_quote', side_effect=RuntimeError('provider unavailable')), \
                patch.object(views, '_handle_card_payment') as pay, self.assertLogs(views.logger, level='ERROR'):
            orders.return_value.first.return_value = None
            self.assertEqual(views.CheckoutView(self.request(method='card')).status_code, 503)
            pay.assert_not_called()

    def test_fulfillment_and_admin_updates_deny_customers(self):
        with patch('order.permissions.UserRole.objects.filter') as roles:
            roles.return_value.exists.return_value = False
            for view, method, kwargs in (
                (views.CreateOutboundShipmentView.as_view(), 'post', {'order_id': 1}),
                (views.InitiateReturnView.as_view(), 'post', {'order_id': 1}),
                (views.DownloadLabelView.as_view(), 'get', {'shipment_id': 1}),
                (views.AdminorderUpdateView, 'post', {}),
                (views.AdminorderReturnRequestView, 'get', {}),
            ):
                req = getattr(self.factory, method)('/test/', {}, format='json')
                force_authenticate(req, user=self.user)
                self.assertEqual(view(req, **kwargs).status_code, 403)

    def test_staff_and_application_admin_allowed(self):
        self.user.is_staff = True
        self.assertTrue(is_order_admin(self.user))
        self.user.is_staff = False
        with patch('order.permissions.UserRole.objects.filter') as roles:
            roles.return_value.exists.return_value = True
            self.assertTrue(is_order_admin(self.user))

    def test_customer_order_scope(self):
        with patch('order.permissions.is_order_admin', return_value=False), \
                patch.object(views.Order.objects, 'filter') as orders:
            accessible_orders(self.user)
            orders.assert_called_once_with(user=self.user)

    def test_wrong_order_items_rejected_before_ups(self):
        self.user.is_staff = True
        req = self.factory.post('/test/', {'item_ids': [999]}, format='json')
        force_authenticate(req, user=self.user)
        with patch.object(views, 'get_object_or_404'), patch.object(views.OrderItem.objects, 'filter') as items, \
                patch.object(views.ups, 'create_shipment') as ups:
            items.return_value.count.return_value = 0
            self.assertEqual(views.CreateOutboundShipmentView.as_view()(req, order_id=1).status_code, 400)
            ups.assert_not_called()

    def test_public_label_paths_blocked_before_file_access(self):
        for path in ('shipping_labels/label.gif', 'products/../shipping_labels/label.gif',
                     'shipping_labels\\label.gif'):
            with self.subTest(path=path), self.assertRaises(Http404):
                cached_media_serve(self.factory.get('/media/' + path), path)

    def test_address_alias_cannot_bypass_tax(self):
        address = dict(country='US', state='KY', country_code='XX', state_code='OR')
        with patch.object(pricing, 'price_items', return_value=Decimal('100')), \
                patch.object(pricing, 'coupon_discount', return_value=(None, Decimal('0'))), \
                patch.object(pricing, 'shipping_quote', return_value=Decimal('20')), \
                patch.object(pricing, 'calculate_tax_and_shipping', return_value={'tax_amount': 6, 'tax_rate': .06}) as tax:
            pricing.checkout_quote([SimpleNamespace(quantity=1)], self.user, address)
            self.assertEqual(tax.call_args.kwargs['shipping_country'], 'US')
            self.assertEqual(tax.call_args.kwargs['shipping_state'], 'KY')

    def test_category_shipping_and_quantity_based_package(self):
        item = SimpleNamespace(id=1, total_price=Decimal('100'), quantity=2,
            product=SimpleNamespace(is_shipping_required=True),
            checkout_sku=SimpleNamespace(length=1, width=2, height=3, weight=4))
        with patch('cart.views._category_group', return_value='A') as group, \
                patch.object(pricing.Settings.objects, 'filter') as config, \
                patch.object(pricing, 'UPSService') as ups:
            config.return_value.first.return_value = None
            self.assertEqual(pricing.shipping_quote([item], {}), Decimal('20'))
            item.total_price = Decimal('500')
            self.assertEqual(pricing.shipping_quote([item], {}), Decimal('0'))
            ups.assert_not_called()
            group.return_value = None
            ups.return_value.get_rates.return_value = [{'total_charge': '35', 'currency': 'USD'}]
            self.assertEqual(pricing.shipping_quote([item], {}), Decimal('35'))
            self.assertEqual(ups.return_value.get_rates.call_args.kwargs['package']['weight_lb'], 8)
            ups.return_value.get_rates.return_value = []
            with self.assertRaises(ValueError):
                pricing.shipping_quote([item], {})

    def test_order_endpoints_return_404_for_inaccessible_orders(self):
        for view in (views.orderItemsView, views.ShippmentOrderItemsView, views.orderReturnRequestView):
            req = self.factory.get('/test/', {'order_id': 99, 'note': 'test'})
            force_authenticate(req, user=self.user)
            with patch.object(views, 'accessible_orders') as scope:
                scope.return_value = MagicMock(spec=QuerySet)
                scope.return_value.model = views.Order
                scope.return_value.get.side_effect = views.Order.DoesNotExist
                scope.return_value.prefetch_related.return_value = scope.return_value
                self.assertEqual(view(req).status_code, 404)

    def test_authorized_label_download_is_private(self):
        self.user.is_staff = True
        req = self.factory.get('/test/')
        force_authenticate(req, user=self.user)
        shipment = SimpleNamespace(shipping_label=MagicMock(), is_return=False, tracking_number='test')
        shipment.shipping_label.read.return_value = b'GIF89a'
        with patch.object(views, 'get_object_or_404', return_value=shipment):
            response = views.DownloadLabelView.as_view()(req, shipment_id=1)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.content, b'GIF89a')
            self.assertEqual(response['Cache-Control'], 'private, no-store')

    def test_print_view_embeds_label_after_authorization(self):
        from io import BytesIO
        self.user.is_staff = True
        req = self.factory.get('/test/')
        force_authenticate(req, user=self.user)
        order = SimpleNamespace(id=1, tax_amount=0, fullName='Test', shipping_address_line1='1 Main',
            shipping_city='Lexington', shipping_state='KY', shipping_postal_code='40502', shipping_country='US')
        shipment = SimpleNamespace(id=1, order=order, shipping_label=MagicMock(), items=MagicMock(),
            shipment_type='outbound', is_return=False, tracking_number='test', carrier='UPS',
            label_created_at=None, return_reason='')
        shipment.shipping_label.open.return_value = BytesIO(b'GIF89a')
        shipment.items.select_related.return_value.all.return_value = []
        config = SimpleNamespace(name='Test', street='1 Main', city='Lexington', state='KY', zip='40502', phone='')
        with patch.object(views, 'get_object_or_404', return_value=shipment), \
                patch.object(views.UPSConfig.objects, 'first', return_value=config):
            response = views.PrintLabelView.as_view()(req, shipment_id=1)
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.data['label_url'].startswith('data:image/gif;base64,'))
            self.assertEqual(response['Cache-Control'], 'private, no-store')

    def test_tax_service_uses_verified_shipping_cost(self):
        from order import tax_service
        config = dict(enabled=True, provider='quickbooks')
        with patch.object(tax_service, '_get_runtime_tax_config', return_value=config), \
                patch.object(tax_service, '_calculate_with_quickbooks', return_value=(Decimal('6'), Decimal('.06'), '')) as tax:
            result = tax_service.calculate_tax_and_shipping(subtotal=Decimal('100'), shipping_cost=Decimal('35'),
                shipping_state='KY', shipping_country='US', shipping_postal_code='40502', item_quantity=8)
            self.assertEqual(result['total'], 141)
            self.assertEqual(tax.call_args.kwargs['shipping_cost'], Decimal('35'))
