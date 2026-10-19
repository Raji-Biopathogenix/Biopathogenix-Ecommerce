from unittest.mock import Mock, patch

import requests
from django.core import mail
from django.core.cache import cache
from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIClient


@override_settings(TURNSTILE_SITE_KEY="", TURNSTILE_SECRET_KEY="")
class PublicFormProtectionTests(SimpleTestCase):
    payload = {"first_name": "Jane", "email": "jane@example.com", "message": "Please send assay details."}
    url = "/api/contact-form/"

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def post(self, data=None, url=None, **extra):
        return self.client.post(url or self.url, data if data is not None else self.payload, format="json", **extra)

    def test_legitimate_contact_is_delivered_once_across_url_aliases(self):
        self.assertEqual(self.post().status_code, 201)
        self.assertEqual(self.post(url="/api/v1/contact-form").status_code, 429)
        self.assertEqual(len(mail.outbox), 1)

    def test_honeypot_is_enforced_on_every_email_form(self):
        for endpoint in ("contact-form", "assay-intake", "contact-validation", "assay-inquiry",
                         "quality-control-availability", "panel-assessment", "custom-target-request"):
            with self.subTest(endpoint=endpoint):
                response = self.post({**self.payload, "website": "spam.example"}, f"/api/{endpoint}/")
                self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)

    def test_all_seven_forms_still_accept_legitimate_requests(self):
        payloads = {
            "contact-form": self.payload,
            "assay-intake": {"name": "Jane", "email": "jane@example.com", "reason": "Assay quote"},
            "contact-validation": {"name": "Jane", "email": "jane@example.com", "phone": "1234567890",
                                   "laboratory": "Example Lab", "validating_for": ["CLIA"]},
            "quality-control-availability": {"first_name": "Jane", "last_name": "Doe",
                                             "laboratory": "Example Lab", "phone": "1234567890"},
            "assay-inquiry": {"name": "Jane", "work_email": "jane@example.com",
                              "organization_lab": "Example Lab", "help_type": "Multiplex design"},
            "panel-assessment": {"name": "Jane", "email": "jane@example.com", "interest": "AMR",
                                 "message": "Six target panel"},
            "custom-target-request": {"name": "Jane", "email": "jane@example.com", "organization_lab": "Example Lab",
                                      "panel_type": "Custom", "targets": "Target A, Target B"},
        }
        for endpoint, payload in payloads.items():
            with self.subTest(endpoint=endpoint):
                cache.clear()
                response = self.post(payload, f"/api/{endpoint}/")
                self.assertIn(response.status_code, (200, 201), response.data)

    def test_invalid_email_header_injection_oversize_and_nonstring_are_rejected(self):
        for values in ({"email": "bad-email"}, {"subject": "Hello\r\nBcc: victim@example.com"},
                       {"message": "a" * 5001}, {"first_name": {"invalid": True}}, {"message": ["invalid"]}):
            with self.subTest(values=str(values)[:50]):
                self.assertEqual(self.post({**self.payload, **values}).status_code, 400)
        self.assertEqual(self.post(["invalid"]).status_code, 400)
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(FORM_SUBMISSIONS_PER_15_MINUTES=2)
    def test_ip_limit_cannot_be_bypassed_by_changing_email_or_forwarded_header(self):
        self.assertEqual(self.post().status_code, 201)
        self.assertEqual(self.post({**self.payload, "email": "two@example.com"}).status_code, 201)
        response = self.post({**self.payload, "email": "three@example.com"}, HTTP_X_FORWARDED_FOR="192.0.2.123")
        self.assertEqual(response.status_code, 429)
        self.assertIn("Retry-After", response)
        self.assertEqual(len(mail.outbox), 2)

    @override_settings(FORM_SUBMISSIONS_PER_EMAIL_PER_HOUR=1)
    def test_email_limit_applies_across_ips_and_forms(self):
        self.assertEqual(self.post().status_code, 201)
        response = self.post({"name": "Jane", "email": "JANE@example.com", "reason": "Quote please"},
                             "/api/assay-intake/", REMOTE_ADDR="192.0.2.2")
        self.assertEqual(response.status_code, 429)
        self.assertEqual(len(mail.outbox), 1)

    @override_settings(FORM_SUBMISSIONS_PER_15_MINUTES=1, FORM_TRUSTED_PROXY_IPS=["127.0.0.1"])
    def test_only_configured_proxy_can_supply_visitor_ip_and_forged_prefix_is_ignored(self):
        first = self.post(HTTP_X_FORWARDED_FOR="192.0.2.1")
        second = self.post({**self.payload, "email": "second@example.com"}, HTTP_X_FORWARDED_FOR="192.0.2.2")
        forged = self.post({**self.payload, "email": "third@example.com"},
                           HTTP_X_FORWARDED_FOR="192.0.2.99, 192.0.2.2")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(forged.status_code, 429)
        self.assertEqual(len(mail.outbox), 2)

    def test_failed_validation_does_not_poison_duplicate_cache(self):
        with patch("chatbot.views._send_email", side_effect=RuntimeError("delivery unavailable")):
            self.assertEqual(self.post().status_code, 500)
        self.assertEqual(self.post().status_code, 201)
        self.assertEqual(len(mail.outbox), 1)

    def test_invalid_submission_can_be_retried(self):
        bad = {**self.payload, "first_name": ""}
        self.assertEqual(self.post(bad).status_code, 400)
        self.assertEqual(self.post(bad).status_code, 400)
        self.assertEqual(self.post().status_code, 201)

    @override_settings(TURNSTILE_SITE_KEY="public-key", TURNSTILE_SECRET_KEY="private-key",
                       TURNSTILE_ALLOWED_HOSTNAMES=["biopathogenix.com"])
    @patch("api.form_protection.requests.post")
    def test_turnstile_missing_forged_wrong_hostname_and_wrong_action_send_no_email(self, verify):
        self.assertEqual(self.post().status_code, 400)
        verify.assert_not_called()
        for verification in ({"success": False},
                             {"success": True, "hostname": "attacker.example", "action": "contact_form"},
                             {"success": True, "hostname": "biopathogenix.com", "action": "login"}):
            verify.return_value = Mock(json=Mock(return_value=verification))
            self.assertEqual(self.post({**self.payload, "turnstile_token": "fake"}).status_code, 400)
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(TURNSTILE_SITE_KEY="public-key", TURNSTILE_SECRET_KEY="private-key",
                       TURNSTILE_ALLOWED_HOSTNAMES=["biopathogenix.com"])
    @patch("api.form_protection.requests.post")
    def test_turnstile_success_and_service_outage(self, verify):
        verify.side_effect = requests.Timeout()
        self.assertEqual(self.post({**self.payload, "turnstile_token": "token"}).status_code, 503)
        self.assertEqual(len(mail.outbox), 0)
        verify.side_effect = None
        verify.return_value = Mock(json=Mock(return_value={
            "success": True, "hostname": "biopathogenix.com", "action": "contact_form",
        }))
        self.assertEqual(self.post({**self.payload, "turnstile_token": "fresh-token"}).status_code, 201)
        self.assertEqual(verify.call_args.kwargs["timeout"], 8)
        self.assertEqual(len(mail.outbox), 1)

    @override_settings(TURNSTILE_SITE_KEY="public-key", TURNSTILE_SECRET_KEY="private-key")
    def test_configuration_exposes_only_public_key(self):
        self.assertEqual(self.client.get("/api/form-protection-config/").json(), {"site_key": "public-key"})
