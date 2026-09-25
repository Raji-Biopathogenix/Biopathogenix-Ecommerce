from decimal import Decimal, ROUND_HALF_UP
from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from cart.views import CalculateTaxView
from order import pricing, tax_service


class CouponTaxTests(SimpleTestCase):
    def test_preview_and_checkout_use_same_discounted_tax_base(self):
        user = SimpleNamespace(id=1, pk=1, is_authenticated=True, is_active=True)
        items = [SimpleNamespace(quantity=3)]
        address = dict(country='US', state='KY', postal_code='40517')

        def tax_quote(**kwargs):
            # Example provider response: 6% on products and shipping separately.
            cents = Decimal('.01')
            amount = (kwargs['subtotal'] * Decimal('.06')).quantize(cents, rounding=ROUND_HALF_UP)
            amount += (kwargs['shipping_cost'] * Decimal('.06')).quantize(cents, rounding=ROUND_HALF_UP)
            return amount, Decimal('.06'), ''

        for discount, expected_tax, expected_total in (
            ('34.50', '20.76', '366.79'),  # Screenshot: 10% coupon
            ('15.00', '21.93', '387.46'),  # Fixed coupon
            ('0.00', '22.83', '403.36'),
            ('345.00', '2.13', '37.66'),  # Only shipping remains taxable
        ):
            with self.subTest(discount=discount), \
                    patch.object(pricing, 'price_items', return_value=Decimal('345.00')), \
                    patch.object(pricing, 'coupon_discount', return_value=(None, Decimal(discount))), \
                    patch.object(pricing, 'shipping_quote', return_value=Decimal('35.53')), \
                    patch('cart.views.Cart.objects.filter') as carts, \
                    patch.object(tax_service, '_get_runtime_tax_config', return_value=dict(enabled=True, provider='quickbooks')), \
                    patch.object(tax_service, '_calculate_with_quickbooks', side_effect=tax_quote) as provider:
                carts.return_value.select_related.return_value = items
                request = APIRequestFactory().post('/tax/calculate/', {
                    'shipping_country': 'US', 'shipping_state': 'KY', 'shipping_postal_code': '40517',
                    'shipping': '35.53', 'amount': '0.01',  # Client amount must not control tax.
                }, format='json')
                force_authenticate(request, user=user)
                preview = CalculateTaxView.as_view()(request)
                self.assertEqual(preview.status_code, 200)
                quote = pricing.checkout_quote(items, user, dict(address))
                self.assertEqual(quote['tax_amount'], Decimal(expected_tax))
                self.assertEqual(quote['amount'], Decimal(expected_total))
                self.assertEqual(Decimal(str(preview.data['result']['amount_to_collect'])), quote['tax_amount'])
                self.assertEqual(provider.call_count, 2)
                for call in provider.call_args_list:
                    self.assertEqual(call.kwargs['subtotal'], Decimal('345.00') - Decimal(discount))
                    self.assertEqual(call.kwargs['shipping_cost'], Decimal('35.53'))

    def test_preview_rejects_expired_coupon_without_quoting_tax(self):
        request = APIRequestFactory().post('/tax/calculate/', {
            'shipping_country': 'US', 'shipping_state': 'KY', 'shipping_postal_code': '40517',
        }, format='json')
        force_authenticate(request, user=SimpleNamespace(id=1, pk=1, is_authenticated=True))
        with patch('cart.views.Cart.objects.filter'), \
                patch.object(pricing, 'price_items', return_value=Decimal('345')), \
                patch.object(pricing, 'coupon_discount', side_effect=ValueError('Coupon expired')), \
                patch.object(tax_service, 'calculate_tax_and_shipping') as tax:
            self.assertEqual(CalculateTaxView.as_view()(request).status_code, 400)
            tax.assert_not_called()
