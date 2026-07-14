import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from services.emailService import send_graph_email

logger = logging.getLogger(__name__)

CONTACT_RECIPIENTS = [
    "info@biopathogenix.com",
    "rajeswari.gopu@biopathogenix.com",
    "davron.bowman@biopathogenix.com",
]

CUSTOM_TARGET_RECIPIENTS = [
    "info@biopathogenix.com",
]
CUSTOM_TARGET_CC_RECIPIENTS = [
    "rajeswari.gopu@biopathogenix.com",
    "support@biopathogenix.com",
]
CUSTOM_TARGET_ALLOWED_FILE_EXTENSIONS = {"xlsx", "xls", "pdf", "doc", "docx", "csv"}
CUSTOM_TARGET_MAX_FILE_SIZE = 3 * 1024 * 1024


def get_or_none(classmodel, **kwargs):
    try:
        return classmodel.objects.get(**kwargs)
    except classmodel.DoesNotExist:
        return None


class ContactValidationView(APIView):
    permission_classes = [AllowAny]

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

        recipients = CONTACT_RECIPIENTS
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
            if getattr(settings, "GRAPH_ENABLED", False):
                send_graph_email(
                    recipients,
                    subject,
                    html_body=html_body,
                    text_body=text_body,
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                )
            else:
                send_mail(
                    subject=subject,
                    message=text_body,
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                    recipient_list=recipients,
                    html_message=html_body,
                    fail_silently=False,
                )
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


class AssayInquiryView(APIView):
    permission_classes = [AllowAny]

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
            if getattr(settings, "GRAPH_ENABLED", False):
                send_graph_email(
                    CONTACT_RECIPIENTS,
                    subject,
                    html_body=html_body,
                    text_body=text_body,
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                )
            else:
                send_mail(
                    subject=subject,
                    message=text_body,
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                    recipient_list=CONTACT_RECIPIENTS,
                    html_message=html_body,
                    fail_silently=False,
                )
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


class CustomTargetRequestView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

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
            if getattr(settings, "GRAPH_ENABLED", False):
                send_graph_email(
                    CUSTOM_TARGET_RECIPIENTS,
                    subject,
                    html_body=html_body,
                    text_body=text_body,
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                    cc_list=CUSTOM_TARGET_CC_RECIPIENTS,
                    attachments=attachments,
                )
            else:
                email_message = EmailMultiAlternatives(
                    subject=subject,
                    body=text_body,
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                    to=CUSTOM_TARGET_RECIPIENTS,
                    cc=CUSTOM_TARGET_CC_RECIPIENTS,
                )
                email_message.attach_alternative(html_body, "text/html")
                for attachment in attachments:
                    email_message.attach(
                        attachment["name"],
                        attachment["content"],
                        attachment.get("content_type") or "application/octet-stream",
                    )
                email_message.send(fail_silently=False)
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
