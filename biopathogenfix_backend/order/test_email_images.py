from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.template.loader import render_to_string
from django.test import SimpleTestCase, override_settings

from order.email_service import _get_related_products


class EmailImageTests(SimpleTestCase):
    def related_product(self, image_url):
        order = MagicMock()
        order.items.exclude.return_value.values_list.return_value = [1]
        product = SimpleNamespace(name='Cell Lysis Enzyme', price=35, slug='cell-lysis', images=MagicMock())
        product.images.filter.return_value.first.return_value = SimpleNamespace(
            image=SimpleNamespace(url=image_url))
        with patch('product.models.Product.objects.filter') as products:
            products.return_value.exclude.return_value.distinct.return_value.prefetch_related.return_value.__getitem__.return_value = [product]
            return _get_related_products(order)

    @override_settings(BACKEND_URL='https://api.biopathogenix.com/')
    def test_rendered_confirmation_uses_absolute_media_url(self):
        related = self.related_product('/media/products/cell.png')
        expected = 'https://api.biopathogenix.com/media/products/cell.png'
        self.assertEqual(related[0]['image_url'], expected)
        html = render_to_string('emails/order_confirmation_email.html', {'related_products': related})
        self.assertIn(f'src="{expected}"', html)
        self.assertNotIn('src="/media/', html)

    @override_settings(BACKEND_URL='https://api.biopathogenix.com')
    def test_absolute_cdn_url_is_not_prefixed(self):
        expected = 'https://cdn.example.com/cell.png?version=2'
        self.assertEqual(self.related_product(expected)[0]['image_url'], expected)
