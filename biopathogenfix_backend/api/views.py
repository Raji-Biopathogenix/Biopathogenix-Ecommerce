import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from services.emailService import send_graph_email
from .form_protection import protect_form
from utils.form_recipients import FORM_RECIPIENTS, FORM_BCC, LANDING_PAGE_RECIPIENTS

logger = logging.getLogger(__name__)


class FormProtectionConfigView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"site_key": settings.TURNSTILE_SITE_KEY})

# Only the three standalone landing pages send their leads to the order inbox.
PANEL_ASSESSMENT_BCC = [*FORM_BCC, "o5akcx3o@robot.zapier.com"]

CUSTOM_TARGET_ALLOWED_FILE_EXTENSIONS = {"xlsx", "xls", "pdf", "doc", "docx", "csv"}
CUSTOM_TARGET_MAX_FILE_SIZE = 3 * 1024 * 1024

PANEL_ASSESSMENT_SOURCES = {
    "general-value-prop": "General Value Prop landing page",
    "custom-assay-landing-page": "Custom Assay landing page",
    "custom-assay-development": "Custom Assay Development page",
}

# Wording for the shared panel-assessment emails. Sources listed here keep the standard
# routing (support@ with the internal BCC), not the order-inbox routing above.
DEFAULT_REQUEST_COPY = {
    "source_label": "Traceable Pathogen panel landing page",
    "request_kind": "Free Panel Assessment",
    "interest_label": "Application Area",
    "message_label": "Targets & Multiplex Format",
    "confirmation_subject": "We've received your BioPathogenix panel assessment request",
}
REQUEST_COPY_BY_SOURCE = {
    "lyophilized-qpcr-plates": {
        "source_label": "Lyophilized qPCR Plates landing page",
        "request_kind": "Lyophilized qPCR Plate Quote",
        "interest_label": "Interested In",
        "message_label": "Format & Details",
        "confirmation_subject": "We've received your BioPathogenix plate quote request",
    },
    "custom-assays": {
        "source_label": "Custom Assays landing page",
        "request_kind": "Custom Assay Quote",
        "interest_label": "Interested In",
        "message_label": "Details & Comments",
        "confirmation_subject": "We've received your BioPathogenix custom assay quote request",
    },
    "qpcr-assays": {
        "source_label": "Custom qPCR Assays landing page",
        "request_kind": "Custom qPCR Assay",
        "interest_label": "Interested In",
        "message_label": "Targets & Details",
        "confirmation_subject": "We've received your BioPathogenix custom qPCR assay request",
    },
    "molecular-research-solutions": {
        "source_label": "Molecular Research Solutions landing page",
        "request_kind": "Custom Assay Quote",
        "interest_label": "Interested In",
        "message_label": "Details & Comments",
        "confirmation_subject": "We've received your BioPathogenix custom assay quote request",
    },
}


def get_or_none(classmodel, **kwargs):
    try:
        return classmodel.objects.get(**kwargs)
    except classmodel.DoesNotExist:
        return None


def _send_html_email(recipients, subject, html_body, text_body, bcc=None, attachments=None):
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None)
    if getattr(settings, "GRAPH_ENABLED", False):
        send_graph_email(
            recipients,
            subject,
            html_body=html_body,
            text_body=text_body,
            from_email=from_email,
            bcc_list=bcc,
            attachments=attachments,
        )
        return

    email_message = EmailMultiAlternatives(
        subject=subject, body=text_body, from_email=from_email, to=recipients, bcc=bcc or []
    )
    email_message.attach_alternative(html_body, "text/html")
    for attachment in attachments or []:
        email_message.attach(
            attachment["name"],
            attachment["content"],
            attachment.get("content_type") or "application/octet-stream",
        )
    email_message.send(fail_silently=False)


def _send_form_email(subject, html_body, text_body, attachments=None):
    """Send a website form request to the team inboxes, blind-copying FORM_BCC."""
    _send_html_email(FORM_RECIPIENTS, subject, html_body, text_body, bcc=FORM_BCC, attachments=attachments)


class ContactValidationView(APIView):
    permission_classes = [AllowAny]

    @protect_form
    def post(self, request):
        data = request.data
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()
        phone = (data.get("phone") or "").strip()
        laboratory = (data.get("laboratory") or "").strip()
        validating_for = data.get("validating_for") or []
        additional_notes = (data.get("additional_notes") or "").strip()

        if not name or not email or not phone or not laboratory:
            return Response(
                {"message": "Name, email, phone, and laboratory are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(validating_for, list) or not validating_for:
            return Response(
                {"message": "Select at least one validation option."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_options = {"CLIA", "COLA", "CAP"}
        selected_options = []
        for option in validating_for:
            item = str(option).strip().upper()
            if item in allowed_options:
                selected_options.append(item)

        if not selected_options:
            return Response(
                {"message": "Select a valid validation option."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subject = f"New Validation Services Contact Request - {name}"
        context = {
            "name": name,
            "email": email,
            "phone": phone,
            "laboratory": laboratory,
            "validating_for": ", ".join(selected_options),
            "additional_notes": additional_notes or "N/A",
        }
        html_body = render_to_string("emails/validation_services_contact.html", context)
        text_body = render_to_string("emails/validation_services_contact.txt", context)
        plain_fallback = strip_tags(html_body)
        if not text_body.strip():
            text_body = plain_fallback

        try:
            _send_form_email(subject, html_body, text_body)
        except Exception:
            logger.exception("Failed to send validation services contact email")
            return Response(
                {"message": "Failed to send your request. Please try again shortly."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "Thank you. Your request has been sent to our team."},
            status=status.HTTP_200_OK,
        )


class QualityControlAvailabilityView(APIView):
    permission_classes = [AllowAny]

    @protect_form
    def post(self, request):
        data = request.data
        first_name = (data.get("first_name") or "").strip()
        last_name = (data.get("last_name") or "").strip()
        laboratory = (data.get("laboratory") or "").strip()
        phone = (data.get("phone") or "").strip()
        message = (data.get("message") or "").strip()

        if not first_name or not last_name or not laboratory or not phone:
            return Response(
                {"message": "First name, last name, laboratory, and phone are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        full_name = f"{first_name} {last_name}"
        subject = f"New Quality Control Availability Request - {full_name}"
        context = {
            "first_name": first_name,
            "last_name": last_name,
            "laboratory": laboratory,
            "phone": phone,
            "message": message or "N/A",
        }
        html_body = render_to_string("emails/quality_control_availability.html", context)
        text_body = render_to_string("emails/quality_control_availability.txt", context)
        plain_fallback = strip_tags(html_body)
        if not text_body.strip():
            text_body = plain_fallback

        try:
            _send_form_email(subject, html_body, text_body)
        except Exception:
            logger.exception("Failed to send quality control availability email")
            return Response(
                {"message": "Failed to send your request. Please try again shortly."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "Thank you. Your request has been sent to our team."},
            status=status.HTTP_200_OK,
        )


class AssayInquiryView(APIView):
    permission_classes = [AllowAny]

    @protect_form
    def post(self, request):
        data = request.data
        name = (data.get("name") or "").strip()
        work_email = (data.get("work_email") or "").strip()
        organization_lab = (data.get("organization_lab") or "").strip()
        help_type = (data.get("help_type") or "").strip()
        additional_details = (data.get("additional_details") or "").strip()

        if not name or not work_email or not organization_lab or not help_type:
            return Response(
                {
                    "message": (
                        "Name, work email, organization/lab, and help type are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_help_types = {
            "Custom assay development",
            "Existing assay recommendation",
            "Multiplex design",
            "Troubleshooting/Technical Support",
        }
        if help_type not in allowed_help_types:
            return Response(
                {"message": "Select a valid help option."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subject = f"New Assay Inquiry Request - {name}"
        context = {
            "name": name,
            "work_email": work_email,
            "organization_lab": organization_lab,
            "help_type": help_type,
            "additional_details": additional_details or "N/A",
        }
        html_body = render_to_string("emails/assay_inquiry_contact.html", context)
        text_body = render_to_string("emails/assay_inquiry_contact.txt", context)
        plain_fallback = strip_tags(html_body)
        if not text_body.strip():
            text_body = plain_fallback

        try:
            _send_form_email(subject, html_body, text_body)
        except Exception:
            logger.exception("Failed to send assay inquiry email")
            return Response(
                {"message": "Failed to send your inquiry. Please try again shortly."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "Thank you. Your inquiry has been sent to our team."},
            status=status.HTTP_200_OK,
        )


class PanelAssessmentView(APIView):
    """Free Panel Assessment requests from the Traceable Pathogen panel landing pages."""

    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    @protect_form
    def post(self, request):
        data = request.data
        fields = {
            key: (data.get(key) or "").strip()
            for key in ("name", "email", "org", "phone", "interest", "message", "source")
        }
        if not fields["name"] or not fields["email"] or not fields["interest"] or not fields["message"]:
            return Response(
                {"message": "Name, work email, application area, and targets are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if "@" not in fields["email"] or len(fields["email"]) > 254:
            return Response({"message": "Enter a valid work email."}, status=status.HTTP_400_BAD_REQUEST)
        if any(len(fields[key]) > 200 for key in ("name", "org", "phone", "interest")) or len(fields["message"]) > 5000:
            return Response({"message": "One or more fields are too long."}, status=status.HTTP_400_BAD_REQUEST)

        attachments = []
        target_file = request.FILES.get("target_file")
        if target_file:
            extension = target_file.name.rsplit(".", 1)[-1].lower()
            if extension not in CUSTOM_TARGET_ALLOWED_FILE_EXTENSIONS or target_file.size > CUSTOM_TARGET_MAX_FILE_SIZE:
                return Response(
                    {"message": "Upload an Excel, PDF, Word, or CSV file no larger than 3 MB."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            attachments.append({
                "name": target_file.name,
                "content": target_file.read(),
                "content_type": target_file.content_type,
            })

        copy = {**DEFAULT_REQUEST_COPY, **REQUEST_COPY_BY_SOURCE.get(fields["source"], {})}
        if fields["source"] in PANEL_ASSESSMENT_SOURCES:
            copy["source_label"] = PANEL_ASSESSMENT_SOURCES[fields["source"]]
        context = {
            **fields,
            **copy,
            "org": fields["org"] or "N/A",
            "phone": fields["phone"] or "N/A",
        }

        try:
            _send_html_email(
                LANDING_PAGE_RECIPIENTS if fields["source"] in PANEL_ASSESSMENT_SOURCES else FORM_RECIPIENTS,
                f"New {copy['request_kind']} Request - {fields['name']}",
                render_to_string("emails/panel_assessment_request.html", context),
                render_to_string("emails/panel_assessment_request.txt", context),
                bcc=PANEL_ASSESSMENT_BCC if fields["source"] in PANEL_ASSESSMENT_SOURCES else FORM_BCC,
                attachments=attachments,
            )
        except Exception:
            logger.exception("Failed to send panel assessment notification email")
            return Response(
                {"message": "Failed to send your request. Please try again shortly."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # The confirmation to the submitter is best-effort: the team already has the request.
        try:
            _send_html_email(
                [fields["email"]],
                copy["confirmation_subject"],
                render_to_string("emails/panel_assessment_confirmation.html", context),
                render_to_string("emails/panel_assessment_confirmation.txt", context),
            )
        except Exception:
            logger.exception("Failed to send panel assessment confirmation email")

        return Response(
            {"message": "Thank you. Your request has been sent to our team."},
            status=status.HTTP_200_OK,
        )


class CustomTargetRequestView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    @protect_form
    def post(self, request):
        data = request.data
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()
        organization_lab = (data.get("organization_lab") or "").strip()
        panel_type = (data.get("panel_type") or "").strip()
        targets = (data.get("targets") or "").strip()
        notes = (data.get("notes") or "").strip()
        target_file = request.FILES.get("target_file")

        if not name or not email or not organization_lab or not panel_type or (not targets and not target_file):
            return Response(
                {"message": "Name, email, organization/lab, panel type, and target text or target file are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attachments = []
        uploaded_file_name = "N/A"
        uploaded_file_size = "N/A"
        if target_file:
            extension = target_file.name.rsplit(".", 1)[-1].lower() if "." in target_file.name else ""
            if extension not in CUSTOM_TARGET_ALLOWED_FILE_EXTENSIONS:
                return Response(
                    {"message": "Upload Excel, PDF, Word, or CSV target files only."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if target_file.size > CUSTOM_TARGET_MAX_FILE_SIZE:
                return Response(
                    {"message": "Target file must be 3 MB or smaller."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            uploaded_file_name = target_file.name
            uploaded_file_size = f"{target_file.size / 1024:.1f} KB"
            attachments.append(
                {
                    "name": target_file.name,
                    "content": target_file.read(),
                    "content_type": target_file.content_type,
                }
            )

        subject = f"Custom Target Request - {panel_type} - {name}"
        context = {
            "name": name,
            "email": email,
            "organization_lab": organization_lab,
            "panel_type": panel_type,
            "targets": targets or "Provided in uploaded file",
            "notes": notes or "N/A",
            "uploaded_file_name": uploaded_file_name,
            "uploaded_file_size": uploaded_file_size,
        }
        html_body = render_to_string("emails/custom_target_request.html", context)
        text_body = render_to_string("emails/custom_target_request.txt", context)
        plain_fallback = strip_tags(html_body)
        if not text_body.strip():
            text_body = plain_fallback

        try:
            _send_form_email(subject, html_body, text_body, attachments=attachments)
        except Exception:
            logger.exception("Failed to send custom target request email")
            return Response(
                {"message": "Failed to send your custom target request. Please try again shortly."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "Thank you. Your custom target request has been sent to our team."},
            status=status.HTTP_200_OK,
        )
