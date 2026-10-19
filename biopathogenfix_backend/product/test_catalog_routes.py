from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from category.models import Category
from product.models import Product


class CatalogRouteTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        user = get_user_model().objects.create_user(email="catalog@example.com")
        self.category = Category.objects.create(name="Assays", display_type="product_card", created_by=user)
        self.subcategory = Category.objects.create(
            name="Respiratory", parent=self.category, display_type="product_card", created_by=user,
        )
        for index in range(3):
            product = Product.objects.create(name=f"Assay {index}", sku=f"TEST-{index}", price=10, created_by=user)
            product.categories.add(self.subcategory)
        self.query = {"category_slug": self.category.slug, "sub_category_slug": self.subcategory.slug, "page_size": 2}

    def get(self, query=None, loader=False):
        endpoint = "get-products-by-sub-category-loaderView" if loader else "get-products-by-sub-category"
        return self.client.get(f"/api/v1/products/{endpoint}/", self.query if query is None else query)

    def test_discovery_and_old_tag_urls_are_rejected_without_database_lookups_or_exception_logs(self):
        paths = [(".well-known", "traffic-advice"), (".well-known", "apple-app-site-association"),
                 (".well-known", "assetlinks.json"), (".well-known", "change-password"),
                 ("product-tag", "sars-cov-2"), ("product-tag", "qcheck-uti-control-5")]
        for category, subcategory in paths:
            for loader in (False, True):
                with self.subTest(category=category, subcategory=subcategory, loader=loader):
                    with patch("product.views.logger.exception") as log, patch("product.views.Category.objects.get") as lookup:
                        response = self.get({"category_slug": category, "sub_category_slug": subcategory}, loader)
                    self.assertEqual(response.status_code, 404)
                    lookup.assert_not_called()
                    log.assert_not_called()

    def test_unknown_blog_embed_and_missing_categories_are_quiet_404s(self):
        for query in ({"category_slug": "why-flu-season-hits-hard-and-how-labs-can-prepare", "sub_category_slug": "embed"},
                      {**self.query, "sub_category_slug": "missing"}):
            for loader in (False, True):
                with patch("product.views.logger.exception") as log:
                    self.assertEqual(self.get(query, loader).status_code, 404)
                log.assert_not_called()

    def test_loader_response_is_consistent_on_cold_and_warm_cache(self):
        first = self.get(loader=True)
        second = self.get(loader=True)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.data, second.data)
        self.assertEqual(len(first.data["result"]["data"]), 2)
        self.assertEqual(first.data["result"]["count"], 3)
        self.assertIsNotNone(first.data["result"]["next"])
        self.assertEqual(self.get().data, first.data)
        next_page = self.get({**self.query, "page": 2}, loader=True)
        self.assertEqual(len(next_page.data["result"]["data"]), 1)
        self.assertIsNone(next_page.data["result"]["next"])

    def test_page_sizes_have_separate_cache_entries(self):
        self.assertEqual(len(self.get().data["result"]["data"]), 2)
        self.assertEqual(len(self.get({**self.query, "page_size": 1}).data["result"]["data"]), 1)

    def test_out_of_range_page_is_quiet_404(self):
        with patch("product.views.logger.exception") as log:
            self.assertEqual(self.get({**self.query, "page": 999}).status_code, 404)
        log.assert_not_called()

    def test_unexpected_database_error_is_logged_as_server_failure(self):
        with patch("product.views.Category.objects.get", side_effect=RuntimeError("database unavailable")):
            with patch("product.views.logger.exception") as log:
                self.assertEqual(self.get().status_code, 500)
        log.assert_called_once()

    def test_top_level_category_valid_missing_and_malformed_requests(self):
        url = "/api/v1/products/get-products-by-category/"
        self.assertEqual(self.client.get(url, {"category_slug": "assays"}).status_code, 200)
        self.assertEqual(self.client.get(url, {"category_slug": "missing"}).status_code, 404)
        self.assertEqual(self.client.get(url, {"category_slug": ".well-known"}).status_code, 404)
        self.assertEqual(self.client.get(url).status_code, 400)
