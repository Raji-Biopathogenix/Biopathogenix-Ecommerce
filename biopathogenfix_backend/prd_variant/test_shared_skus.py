import json
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch

from django import forms
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.test import TestCase, RequestFactory
from rest_framework.test import APIRequestFactory, force_authenticate

from cart.models import Cart, CartVariants
from cart.serializers import CartResponseSerializer
from cart.views import CartViewset
from order.models import Order, OrderItem, OrderVariants
from order.pricing import price_items
from payments.utils import _build_invoice_line_items, get_qb_item_by_sku
from product.admin import ProductAdmin, ProductAdminForm
from product.models import Product
from variant.models import Variant, VariantOption
from .models import ProductSKU, ProductSKUOption
from .resolution import sku_for_item, resolve_sku


class SharedSkuTests(TestCase):
    def setUp(self):
        cache_patch = patch.object(ProductAdmin, '_clear_product_caches')
        cache_patch.start()
        self.addCleanup(cache_patch.stop)
        self.user = get_user_model().objects.create(email='variants@example.com', is_staff=True)
        self.product = Product.objects.create(name='Disposable lab coats', sku='COATS',
            price=25, created_by=self.user, has_variants=True)
        size = Variant.objects.create(name='Size')
        pack = Variant.objects.create(name='Package')
        self.sizes = [VariantOption.objects.create(variant=size, value=value) for value in ('S', 'M', 'L')]
        self.packs = [VariantOption.objects.create(variant=pack, value=value) for value in ('Bag of 10', 'Case of 100')]
        self.combos = [dict(sku_code='LS-50401' + ('-Case' if index else ''),
                           option_ids=[size.pk, pack.pk], price=225 if index else 25, stock=10)
                       for index, pack in enumerate(self.packs) for size in self.sizes]
        self.save_combos()

    def save_combos(self):
        request = RequestFactory().post('/', {
            'selected_variant_options': ','.join(str(row.pk) for row in self.sizes + self.packs),
            'sku_combinations': json.dumps(self.combos)})
        form = SimpleNamespace(instance=self.product)
        with patch.object(admin.ModelAdmin, 'save_related'):
            ProductAdmin(Product, admin.site).save_related(request, form, [], True)

    def sku(self, size=0, pack=0):
        return resolve_sku(self.product.pk, option_ids=[self.sizes[size].pk, self.packs[pack].pk])

    def add(self, sku, **overrides):
        data = dict(product_id=self.product.pk, quantity=1, tmp_id='test', has_variants=True,
                    skuObj={'id': sku.pk, 'sku_code': sku.sku_code, 'price': '.01'})
        data.update(overrides)
        request = APIRequestFactory().post('/', data, format='json')
        force_authenticate(request, user=self.user)
        return CartViewset.as_view({'post': 'create'})(request)

    def test_admin_saves_and_updates_six_combinations_with_shared_skus(self):
        self.assertEqual(self.product.skus.count(), 6)
        self.assertEqual(self.product.skus.filter(sku_code='LS-50401').count(), 3)
        ids = list(self.product.skus.order_by('pk').values_list('pk', flat=True))
        self.combos[1]['stock'] = 4
        self.save_combos()
        self.assertEqual(list(self.product.skus.order_by('pk').values_list('pk', flat=True)), ids)
        self.assertEqual(self.sku(1).stock, 4)
        self.assertEqual(self.sku(1, 1).price, Decimal('225'))

    def test_admin_accepts_shared_codes_and_rejects_duplicate_options(self):
        form = ProductAdminForm(data={'sku_combinations': json.dumps(self.combos)}, instance=self.product)
        with patch.object(forms.ModelForm, 'clean', return_value={'has_variants': True}):
            form.clean()
            form.data = {'sku_combinations': json.dumps([self.combos[0], self.combos[0]])}
            with self.assertRaisesMessage(forms.ValidationError, 'exactly once'):
                form.clean()

    def test_cart_keeps_sizes_separate_and_uses_server_price(self):
        for sku in (self.sku(0), self.sku(1), self.sku(0, 1)):
            self.assertEqual(self.add(sku).status_code, 201)
        self.assertEqual(self.add(self.sku(0)).status_code, 200)
        self.assertEqual(Cart.objects.count(), 3)
        self.assertEqual(Cart.objects.get(sku=self.sku(0)).quantity, 2)
        self.assertEqual(price_items(list(Cart.objects.all()), self.user), Decimal('300'))
        for row in Cart.objects.all():
            self.assertEqual(CartResponseSerializer(row).data['product_sku']['id'], row.sku_id)

    def test_cart_rejects_wrong_product_identity_and_ambiguous_code(self):
        self.assertEqual(self.add(self.sku(), product_id=99999).status_code, 400)
        self.assertEqual(self.add(self.sku(), skuObj={'sku_code': 'LS-50401'}).status_code, 400)
        self.assertEqual(Cart.objects.count(), 0)

    def test_nonvariant_zero_id_fallback_still_works(self):
        product = Product.objects.create(name='Single product', sku='SINGLE', price=12, created_by=self.user)
        sku = ProductSKU.objects.create(product=product, sku_code='SINGLE', price=12, stock=3)
        response = self.add(sku, product_id=product.pk, has_variants=False,
                            skuObj={'id': 0, 'sku_code': 'SINGLE', 'sku_options': []})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Cart.objects.get().sku, sku)

    def test_checkout_and_quantity_update_use_selected_variant_stock(self):
        self.add(self.sku(1))
        row = Cart.objects.get()
        ProductSKU.objects.filter(pk=self.sku(1).pk).update(stock=1)
        request = APIRequestFactory().patch('/', {'quantity': 2}, format='json')
        force_authenticate(request, user=self.user)
        result = CartViewset.as_view({'patch': 'partial_update'})(request, pk=row.pk)
        self.assertEqual(result.status_code, 400)
        row.quantity = 2
        with self.assertRaisesMessage(ValueError, 'insufficient stock'):
            price_items([row], self.user)

    def test_legacy_cart_resolves_exact_options_and_refuses_ambiguity(self):
        row = Cart.objects.create(user=self.user, product=self.product, sku_code='LS-50401')
        self.assertIsNone(sku_for_item(row))
        for option in (self.sizes[1], self.packs[0]):
            CartVariants.objects.create(cart=row, variant_option=option)
        self.assertEqual(sku_for_item(row), self.sku(1))

    def test_saved_identity_survives_display_sku_rename(self):
        self.add(self.sku(1))
        row = Cart.objects.get()
        ProductSKU.objects.filter(pk=row.sku_id).update(sku_code='RENAMED')
        self.assertEqual(sku_for_item(row).pk, row.sku_id)
        self.assertEqual(price_items([row], self.user), Decimal('25'))

    def test_migrations_backfill_only_unambiguous_existing_records(self):
        from importlib import import_module
        from django.apps import apps
        from django.db import connection
        product = Product.objects.create(name='Legacy product', sku='LEGACY', price=12, created_by=self.user)
        sku = ProductSKU.objects.create(product=product, sku_code='LEGACY', price=12, stock=3)
        row = Cart.objects.create(user=self.user, product=product, sku_code='LEGACY')
        ambiguous = Cart.objects.create(user=self.user, product=self.product, sku_code='LS-50401')
        order = Order.objects.create(user=self.user, amount=12, subtotal=12)
        item = OrderItem.objects.create(order=order, product=product, sku_code='LEGACY',
                                       product_name=product.name, unit_price=12, total=12)
        editor = SimpleNamespace(connection=connection)
        import_module('cart.migrations.0014_cart_sku').backfill_sku_ids(apps, editor)
        import_module('order.migrations.0037_orderitem_sku').backfill_sku_ids(apps, editor)
        row.refresh_from_db()
        item.refresh_from_db()
        ambiguous.refresh_from_db()
        self.assertEqual(row.sku_id, sku.pk)
        self.assertEqual(item.sku_id, sku.pk)
        self.assertIsNone(ambiguous.sku_id)

    def test_invoice_lines_keep_variant_labels_and_order_item_identity(self):
        order = Order.objects.create(user=self.user, amount=50, subtotal=50)
        items = []
        for size in (0, 1):
            item = OrderItem.objects.create(order=order, product=self.product, sku=self.sku(size),
                product_name=self.product.name, sku_code='LS-50401', unit_price=25, total=25)
            OrderVariants.objects.create(order=order, order_item=item,
                variant_option=self.sizes[size], variant_option_name=self.sizes[size].value)
            items.append(item)
        with patch('payments.utils.get_qb_item_by_sku', return_value='qb-item'):
            lines = _build_invoice_line_items('token', 'realm', 'url', order, items, 'default')
        for item, line, label in zip(items, lines, ('S', 'M')):
            self.assertIn(f'Order item: {item.pk}', line['Description'])
            self.assertIn(f'Options: {label}', line['Description'])
            self.assertEqual(line['Amount'], 25)

    def test_quickbooks_does_not_choose_first_ambiguous_catalog_match(self):
        with patch('payments.utils.requests.get') as get:
            get.return_value.json.return_value = {'QueryResponse': {'Item': [
                {'Id': 'small', 'Type': 'Inventory'}, {'Id': 'large', 'Type': 'Inventory'}]}}
            self.assertIsNone(get_qb_item_by_sku('token', 'realm', 'url', 'LS-50401'))
