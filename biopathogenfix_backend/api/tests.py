from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from api.views import FORM_BCC, FORM_RECIPIENTS, PANEL_ASSESSMENT_BCC


class PanelAssessmentViewTests(TestCase):
    url = "/api/panel-assessment/"
    payload = {
        "name": "Jane Doe",
        "email": "jane@lab.example",
        "org": "Example Lab",
        "phone": "",
        "interest": "AMR / ABR",
        "message": "6-target AMR panel, single tube",
        "source": "custom-assay-landing-page",
    }

    def setUp(self):
        self.client = APIClient()

    def test_sends_team_notification_and_submitter_confirmation(self):
        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 2)
        notification, confirmation = mail.outbox
        self.assertEqual(notification.to, FORM_RECIPIENTS)
        self.assertEqual(notification.bcc, PANEL_ASSESSMENT_BCC)
        self.assertIn("Jane Doe", notification.subject)
        self.assertIn("Custom Assay landing page", notification.body)
        self.assertIn("6-target AMR panel", notification.body)
        self.assertEqual(confirmation.to, ["jane@lab.example"])
        self.assertEqual(confirmation.bcc, [])

    def test_zapier_bcc_is_scoped_to_three_standalone_pages(self):
        for source in ("general-value-prop", "custom-assay-landing-page", "custom-assay-development", "other-page", ""):
            with self.subTest(source=source):
                mail.outbox.clear()
                response = self.client.post(self.url, {**self.payload, "source": source}, format="json")
                self.assertEqual(response.status_code, 200)
                expected = [*FORM_BCC, "o5akcx3o@robot.zapier.com"] if source in (
                    "general-value-prop", "custom-assay-landing-page", "custom-assay-development"
                ) else FORM_BCC
                self.assertEqual(mail.outbox[0].bcc, expected)
                self.assertEqual(mail.outbox[1].bcc, [])

    def test_development_form_attachment_is_in_team_email_only(self):
        response = self.client.post(self.url, {
            **self.payload,
            "source": "custom-assay-development",
            "target_file": SimpleUploadedFile("targets.csv", b"target\nexample", content_type="text/csv"),
        }, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(mail.outbox[0].attachments[0][0], "targets.csv")
        self.assertEqual(mail.outbox[0].bcc, PANEL_ASSESSMENT_BCC)
        self.assertEqual(mail.outbox[1].attachments, [])

    def test_rejects_unsupported_attachment_without_sending(self):
        response = self.client.post(self.url, {
            **self.payload,
            "target_file": SimpleUploadedFile("program.exe", b"test"),
        }, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)

    def test_rejects_missing_required_fields(self):
        response = self.client.post(self.url, {**self.payload, "interest": ""}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)

    def test_rejects_invalid_email(self):
        response = self.client.post(self.url, {**self.payload, "email": "not-an-email"}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)


class FormRecipientsTests(TestCase):
    def test_assay_inquiry_goes_to_team_inboxes(self):
        response = APIClient().post(
            "/api/assay-inquiry/",
            {
                "name": "Jane Doe",
                "work_email": "jane@lab.example",
                "organization_lab": "Example Lab",
                "help_type": "Multiplex design",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(mail.outbox[0].to, ["order@biopathogenix.com", "support@biopathogenix.com"])
        self.assertEqual(mail.outbox[0].bcc, ["rajeswari.gopu@biopathogenix.com"])
