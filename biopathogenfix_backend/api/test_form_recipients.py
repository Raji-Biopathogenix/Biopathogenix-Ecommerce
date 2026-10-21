import io
from types import SimpleNamespace
from unittest.mock import patch

from django.core import mail
from django.core.cache import cache
from django.test import SimpleTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from chatbot.views import _get_recipients, _send_email
from home.career_email_service import send_internal_career_application_email


@override_settings(TURNSTILE_SECRET_KEY="", TURNSTILE_SITE_KEY="", GRAPH_ENABLED=False)
class WebsiteFormRecipientTests(SimpleTestCase):
    def setUp(self):
        cache.clear()

    def assert_regular_recipients(self, email):
        recipients = [*email.to, *email.cc, *email.bcc]
        self.assertNotIn("order@biopathogenix.com", [address.lower() for address in recipients])
        self.assertIn("rajeswari.gopu@biopathogenix.com", recipients)

    def test_all_regular_forms_include_required_copy_and_exclude_order_inbox(self):
        payloads = {
            "contact-form": {"first_name": "Jane", "email": "jane@example.com", "message": "Assay details please"},
            "contact-validation": {"name": "Jane", "email": "jane@example.com", "phone": "1234567890",
                                   "laboratory": "Example Lab", "validating_for": ["CLIA"]},
            "quality-control-availability": {"first_name": "Jane", "last_name": "Doe",
                                             "laboratory": "Example Lab", "phone": "1234567890"},
            "assay-inquiry": {"name": "Jane", "work_email": "jane@example.com",
                              "organization_lab": "Example Lab", "help_type": "Multiplex design"},
            "custom-target-request": {"name": "Jane", "email": "jane@example.com", "organization_lab": "Example Lab",
                                      "panel_type": "Custom", "targets": "Target A"},
            "panel-assessment": {"name": "Jane", "email": "jane@example.com", "interest": "AMR",
                                 "message": "Six targets", "source": "regular-website"},
        }
        for endpoint, payload in payloads.items():
            with self.subTest(endpoint=endpoint):
                cache.clear()
                mail.outbox.clear()
                response = APIClient().post(f"/api/{endpoint}/", payload, format="json")
                self.assertIn(response.status_code, (200, 201))
                self.assert_regular_recipients(mail.outbox[0])

    def test_every_chat_intake_type_includes_required_copy(self):
        for kind in ("custom", "standard", "customer_support", "validation_service", "sales_quote"):
            with self.subTest(kind=kind):
                cache.clear()
                mail.outbox.clear()
                response = APIClient().post("/api/assay-intake/", {
                    "name": "Jane", "email": "jane@example.com", "reason": "Please send details", "assayType": kind,
                }, format="json")
                self.assertEqual(response.status_code, 201)
                self.assert_regular_recipients(mail.outbox[0])

    @override_settings(SUPPORT_TO_EMAIL="order@biopathogenix.com", VALIDATION_TO_EMAIL="ORDER@biopathogenix.com")
    @patch.dict("os.environ", {"SUPPORT_TO_EMAIL": "order@biopathogenix.com", "VALIDATION_TO_EMAIL": "ORDER@biopathogenix.com"})
    def test_old_environment_values_cannot_restore_order_inbox(self):
        self.assertEqual(_get_recipients("sales_quote"), ["support@biopathogenix.com"])
        self.assertEqual(_get_recipients("validation_service"), ["validation@biopathogenix.com"])

    @override_settings(GRAPH_ENABLED=True)
    @patch("chatbot.views.send_graph_email")
    def test_graph_includes_required_blind_copy(self, graph):
        _send_email(["support@biopathogenix.com"], "Contact", "<p>Request</p>")
        self.assertEqual(graph.call_args.kwargs["bcc_list"], ["rajeswari.gopu@biopathogenix.com"])

    @override_settings(GRAPH_ENABLED=True)
    @patch("chatbot.views.send_graph_email", side_effect=RuntimeError("Graph unavailable"))
    def test_smtp_fallback_preserves_required_copy(self, graph):
        _send_email(["support@biopathogenix.com"], "Contact", "<p>Request</p>")
        self.assert_regular_recipients(mail.outbox[0])

    @override_settings(CAREERS_RECIPIENT_EMAIL="careers@biopathogenix.com,order@biopathogenix.com", CAREERS_BCC_EMAIL="")
    def test_careers_includes_required_copy_even_when_optional_bcc_is_empty(self):
        application = SimpleNamespace(role=SimpleNamespace(title="Scientist"), full_name="Jane Doe", email="jane@example.com",
                                      phone="", linkedin_url="", message="Application", created_at=timezone.now(), resume=None)
        send_internal_career_application_email(application)
        self.assertEqual(mail.outbox[0].to, ["careers@biopathogenix.com"])
        self.assert_regular_recipients(mail.outbox[0])

    @override_settings(GRAPH_ENABLED=True)
    @patch("home.career_email_service.send_graph_email")
    def test_careers_uses_graph_with_resume_and_required_copy(self, graph):
        resume = SimpleNamespace(name="careers/resumes/cv.pdf", open=lambda mode: io.BytesIO(b"%PDF-1.4"))
        application = SimpleNamespace(pk=1, role=None, full_name="Jane Doe", email="jane@example.com", phone="",
                                      linkedin_url="", message="General resume submission", created_at=timezone.now(), resume=resume)
        send_internal_career_application_email(application)
        args, kwargs = graph.call_args
        self.assertEqual(args, (["careers@biopathogenix.com"], "New Career Application - General Application"))
        self.assertIn("rajeswari.gopu@biopathogenix.com", kwargs["bcc_list"])
        self.assertEqual(kwargs["reply_to"], ["jane@example.com"])
        self.assertEqual(kwargs["attachments"], [{"name": "cv.pdf", "content": b"%PDF-1.4", "content_type": "application/pdf"}])

    def test_general_resume_without_a_role_goes_to_careers(self):
        application = SimpleNamespace(role=None, full_name="Jane Doe", email="jane@example.com", phone="",
                                      linkedin_url="", message="General resume submission", created_at=timezone.now(), resume=None)
        send_internal_career_application_email(application)
        self.assertEqual(mail.outbox[0].subject, "New Career Application - General Application")
        self.assertEqual(mail.outbox[0].to, ["careers@biopathogenix.com"])
        self.assert_regular_recipients(mail.outbox[0])
