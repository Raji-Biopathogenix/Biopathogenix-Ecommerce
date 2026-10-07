from django.test import TestCase
from django.db import IntegrityError
from .models import CustomUser, Laboratory
from .serializers import UserSerializer

class AutomaticLaboratoryTests(TestCase):
    def test_registration_creates_and_assigns_company_lab_without_activating_user(self):
        serializer = UserSerializer(data={
            "email": "new@example.com", "Company_name": " New Laboratory ",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        user.refresh_from_db()
        self.assertEqual(user.laboratory.name, "New Laboratory")
        self.assertFalse(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.has_usable_password())

    def test_users_reuse_existing_lab_ignoring_case_and_surrounding_spaces(self):
        lab = Laboratory.objects.create(name="Example Laboratory")
        for index, company in enumerate(("Example Laboratory", " example laboratory ")):
            user = CustomUser.objects.create_user(email=f"member{index}@example.com", Company_name=company)
            self.assertEqual(user.laboratory_id, lab.pk)
        self.assertEqual(Laboratory.objects.count(), 1)

    def test_no_company_leaves_lab_empty(self):
        user = CustomUser.objects.create_user(email="personal@example.com", Company_name=" ")
        self.assertIsNone(user.laboratory_id)
        self.assertEqual(Laboratory.objects.count(), 0)

    def test_explicit_admin_lab_assignment_is_preserved(self):
        lab = Laboratory.objects.create(name="Assigned Laboratory")
        user = CustomUser.objects.create_user(
            email="assigned@example.com", Company_name="Different company", laboratory=lab,
        )
        user.save()
        self.assertEqual(user.laboratory_id, lab.pk)
        self.assertEqual(Laboratory.objects.count(), 1)

    def test_existing_user_without_lab_is_linked_on_save(self):
        user = CustomUser.objects.create_user(email="existing@example.com")
        CustomUser.objects.filter(pk=user.pk).update(Company_name="Existing Company")
        user.refresh_from_db()
        user.first_name = "Reviewed"
        user.save(update_fields=["first_name"])
        user.refresh_from_db()
        self.assertEqual(user.laboratory.name, "Existing Company")

    def test_full_length_company_name_is_supported(self):
        company = "L" * 255
        user = CustomUser.objects.create_user(email="long@example.com", Company_name=company)
        self.assertEqual(user.laboratory.name, company)
        user.laboratory.full_clean()

    def test_failed_user_creation_does_not_leave_an_unused_lab(self):
        CustomUser.objects.create_user(email="duplicate@example.com")
        with self.assertRaises(IntegrityError):
            CustomUser.objects.create_user(email="duplicate@example.com", Company_name="Unused Laboratory")
        self.assertFalse(Laboratory.objects.filter(name="Unused Laboratory").exists())



