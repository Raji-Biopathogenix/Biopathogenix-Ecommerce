from django.test import TestCase
from django.db import IntegrityError
from unittest.mock import patch
from rest_framework.test import APIClient
from country.models import Country, State
from .models import CustomUser, Laboratory
from .serializers import UserSerializer

class SignupErrorReportingTests(TestCase):
    def test_unexpected_signup_failure_reports_server_exception(self):
        client = APIClient()
        client.raise_request_exception = False
        with patch("users.serializers.UserSerializer.save", side_effect=RuntimeError("test signup failure")):
            with self.assertLogs("users.views", level="ERROR") as logs:
                response = client.post("/api/v1/signup/", {"email": "failure@example.com"}, format="json")
        self.assertEqual(response.status_code, 500)
        self.assertIn("Signup failed: RuntimeError", logs.output[0])
        self.assertIn("test signup failure", logs.output[0])
        self.assertFalse(CustomUser.objects.filter(email="failure@example.com").exists())

    def test_failure_before_signup_handler_also_reports_server_exception(self):
        client = APIClient()
        client.raise_request_exception = False
        with patch("users.views.CustomerViews.initial", side_effect=RuntimeError("test initialization failure")):
            with self.assertLogs("users.views", level="ERROR") as logs:
                response = client.post("/api/v1/signup/", {}, format="json")
        self.assertEqual(response.status_code, 500)
        self.assertIn("test initialization failure", logs.output[0])

class AutomaticLaboratoryTests(TestCase):
    def test_full_signup_request_with_company_and_address(self):
        country = Country.objects.create(name="United States", code="US")
        state = State.objects.create(name="Kentucky", code="KY", country=country)
        client = APIClient()
        for index in range(2):
            email = f"signup{index}@example.com"
            with patch("users.views.send_verification_email_safe") as send:
                response = client.post("/api/v1/signup/", {
                    "first_name": "Test", "last_name": "User", "email": email,
                    "Company_name": "Example Lab", "Street_Address": "3004 Park Central Ave",
                    "Address_Line_2": "", "state": state.pk, "Town_City": "Nicholasville",
                    "Zip_Code": "40356", "phone_number": "5551234567",
                }, format="json")
            self.assertEqual(response.status_code, 201, response.data)
            user = CustomUser.objects.get(email=email)
            self.assertEqual(user.laboratory.name, "Example Lab")
            self.assertFalse(user.is_active)
            send.assert_called_once()
        self.assertEqual(Laboratory.objects.count(), 1)

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
        for index, company in enumerate(("Example Laboratory", " example laboratory ", "EXAMPLELABORATORY", "Example   Laboratory", "Example\tLaboratory")):
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
