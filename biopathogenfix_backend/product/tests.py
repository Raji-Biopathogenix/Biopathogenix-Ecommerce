from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from cart.models import Cart
from cart.views import CartViewset
from prd_variant.models import ProductSKU, ProductSKUOption, ProductVariantOption
from variant.models import Variant, VariantOption
from .models import Product
from .views import ProductViewset


class ProductSearchSkuTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = get_user_model().objects.create(email='search-skus@example.com')
        self.product = Product.objects.create(
            name='Specimen cup', sku='CUP', price=10,
            created_by=self.user, has_variants=True,
        )
        variant = Variant.objects.create(name='Quantity')
        self.skus = []
        for index, value in enumerate(('1-9', '25+'), start=1):
            option = VariantOption.objects.create(variant=variant, value=value)
            ProductVariantOption.objects.create(product=self.product, variant_option=option)
            sku = ProductSKU.objects.create(
                product=self.product, sku_code=f'CUP-{index}', price=10, stock=100,
            )
            ProductSKUOption.objects.create(sku=sku, variant_option=option)
            self.skus.append(sku)
        ProductSKU.objects.create(
            product=self.product, sku_code='CUP-INACTIVE', price=10,
            stock=100, is_active=False,
        )

    def search(self, text):
        request = self.factory.get('/v1/products/search', {'search_text': text})
        response = ProductViewset.as_view({'get': 'ProductSearch'})(request)
        self.assertEqual(response.status_code, 200)
        return response.data['result']['data']

    def assert_skus_match_options(self, item):
        self.assertEqual({sku['id'] for sku in item['prd_skus']},
                         {sku.pk for sku in self.skus})
        option_ids = {option['id'] for variant in item['prd_variants']
                      for option in variant['variant_options']}
        self.assertEqual(
            {option['variant_option_id'] for sku in item['prd_skus']
             for option in sku['sku_options']}, option_ids,
        )

    def test_search_options_resolve_to_skus_that_can_be_added_to_cart(self):
        data = self.search('cup')
        self.assertTrue(data['search_result'])
        item = data['serializer'][0]
        self.assert_skus_match_options(item)
        for sku in item['prd_skus']:
            request = self.factory.post('/v1/cart', {
                'product_id': item['id'], 'quantity': 1, 'tmp_id': 'search-test',
                'has_variants': True, 'skuObj': sku,
            }, format='json')
            force_authenticate(request, user=self.user)
            response = CartViewset.as_view({'post': 'create'})(request)
            self.assertEqual(response.status_code, 201)
            self.assertTrue(Cart.objects.filter(product=self.product, sku_id=sku['id']).exists())

    def test_recommended_search_products_include_active_skus(self):
        data = self.search('no-matching-product')
        self.assertFalse(data['search_result'])
        self.assert_skus_match_options(data['serializer'][0])
