from django.core import mail
from django.test import TestCase
from rest_framework.test import APIClient

from api.views import FORM_RECIPIENTS


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
        self.assertIn("Jane Doe", notification.subject)
        self.assertIn("Custom Assay landing page", notification.body)
        self.assertIn("6-target AMR panel", notification.body)
        self.assertEqual(confirmation.to, ["jane@lab.example"])

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
        self.assertEqual(mail.outbox[0].to, FORM_RECIPIENTS)
        self.assertEqual(
            FORM_RECIPIENTS,
            ["rajeswari.gopu@biopathogenix.com", "order@biopathogenix.com", "support@biopathogenix.com"],
        )
