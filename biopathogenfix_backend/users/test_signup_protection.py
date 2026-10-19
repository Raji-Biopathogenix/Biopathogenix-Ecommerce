from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from country.models import Country, State
from users.models import CustomUser


@override_settings(TURNSTILE_SECRET_KEY="", TURNSTILE_SITE_KEY="")
class SignupProtectionTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        country = Country.objects.create(name="United States", code="US")
        state = State.objects.create(name="Kentucky", code="KY", country=country)
        self.payload = {"email": "customer@example.com", "first_name": "Jane", "state": state.pk}

    def post(self, **extra):
        return self.client.post("/api/v1/signup/", {**self.payload, **extra}, format="json")

    @patch("users.views.send_verification_email_safe")
    def test_valid_signup_accepts_numeric_state_but_cannot_activate_itself(self, send):
        self.assertEqual(self.post(is_active="true").status_code, 201)
        user = CustomUser.objects.get(email=self.payload["email"])
        self.assertFalse(user.is_active)
        self.assertFalse(user.has_usable_password())
        send.assert_called_once()

    @patch("users.views.send_verification_email_safe")
    def test_honeypot_creates_no_account_and_sends_no_email(self, send):
        self.assertEqual(self.post(website="spam.example").status_code, 400)
        self.assertFalse(CustomUser.objects.exists())
        send.assert_not_called()

    @override_settings(TURNSTILE_SECRET_KEY="private-key", TURNSTILE_SITE_KEY="public-key")
    @patch("users.views.send_verification_email_safe")
    def test_missing_turnstile_token_creates_no_account_or_email(self, send):
        self.assertEqual(self.post().status_code, 400)
        self.assertFalse(CustomUser.objects.exists())
        send.assert_not_called()

    @override_settings(FORM_SUBMISSIONS_PER_15_MINUTES=1)
    @patch("users.views.send_verification_email_safe")
    def test_signup_flood_is_limited_before_second_account_is_created(self, send):
        self.assertEqual(self.post().status_code, 201)
        self.assertEqual(self.post(email="second@example.com").status_code, 429)
        self.assertEqual(CustomUser.objects.count(), 1)
        send.assert_called_once()
