from importlib import import_module
from types import SimpleNamespace

from django.apps import apps
from django.core.exceptions import ValidationError
from django.db import connection
from django.test import TestCase

from product.models import Product
from .laboratory_names import laboratory_name_key
from .models import CustomUser, Laboratory, CustomizableProductprices

merge = import_module("users.migrations.0036_normalize_laboratory_names").merge_laboratories


class LaboratoryNameTests(TestCase):
    def setUp(self):
        self.editor = SimpleNamespace(connection=connection)

    def duplicates(self):
        first = Laboratory.objects.create(name="Dry Ice KY")
        # Simulate records created before normalized names were enforced.
        Laboratory.objects.bulk_create([Laboratory(name="Dryice Ky", name_key="legacy-key")])
        return first, Laboratory.objects.get(name="Dryice Ky")

    def test_case_and_all_whitespace_variants_share_key(self):
        key = laboratory_name_key("Dry Ice KY")
        for name in ("DRY ICE KY", "Dryice Ky", " dry  ice ky ", "Dry\tIce\nKY"):
            self.assertEqual(laboratory_name_key(name), key)
        self.assertNotEqual(laboratory_name_key("Dry Ice NY"), key)

    def test_admin_gets_validation_error_for_duplicate_name(self):
        Laboratory.objects.create(name="Dry Ice KY")
        with self.assertRaisesMessage(ValidationError, "already has a laboratory"):
            Laboratory(name="DRYICEKY").full_clean()

    def test_merging_preserves_users_and_identical_or_distinct_product_prices(self):
        first, second = self.duplicates()
        user = CustomUser.objects.create_user(email="member@example.com", laboratory=second)
        product = Product.objects.create(name="Test Product", sku="LAB-TEST", price=10, created_by=user)
        CustomizableProductprices.objects.create(laboratory=first, product=product, price=8)
        CustomizableProductprices.objects.create(laboratory=second, product=product, price=8)
        other = Product.objects.create(name="Other Product", sku="LAB-OTHER", price=20, created_by=user)
        CustomizableProductprices.objects.create(laboratory=second, product=other, price=15)
        merge(apps, self.editor)
        user.refresh_from_db()
        self.assertEqual(user.laboratory_id, first.pk)
        self.assertEqual(Laboratory.objects.count(), 1)
        self.assertEqual(CustomizableProductprices.objects.filter(laboratory=first).count(), 2)
        self.assertEqual(CustomizableProductprices.objects.get(product=other).price, 15)
        merge(apps, self.editor)
        self.assertEqual(Laboratory.objects.count(), 1)

    def test_conflicting_prices_stop_merge_before_changing_assignments(self):
        first, second = self.duplicates()
        user = CustomUser.objects.create_user(email="conflict@example.com", laboratory=second)
        product = Product.objects.create(name="Test Product", sku="LAB-CONFLICT", price=10, created_by=user)
        for lab, price in ((first, 8), (second, 9)):
            CustomizableProductprices.objects.create(laboratory=lab, product=product, price=price)
        with self.assertRaisesMessage(RuntimeError, "conflicting prices"):
            merge(apps, self.editor)
        user.refresh_from_db()
        self.assertEqual(user.laboratory_id, second.pk)
        self.assertEqual(Laboratory.objects.count(), 2)
        self.assertEqual(CustomizableProductprices.objects.count(), 2)
