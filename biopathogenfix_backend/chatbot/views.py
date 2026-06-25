import logging
import os

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.html import strip_tags

from ai.answer import answer_chat_request

from ai.intake import build_assay_intake_email_html
from .models import PathogenPanelLookup, normalize_lookup_text
from services.emailService import send_graph_email

logger = logging.getLogger(__name__)


def _get_recipients(form_type: str) -> list[str]:
    """Return the correct recipient list based on form type."""
    if form_type in ("sales_quote",):
        raw = os.environ.get("ORDER_TO_EMAIL") or getattr(settings, "ORDER_TO_EMAIL", "order@biopathogenix.com")
    elif form_type in ("validation_service",):
        raw = os.environ.get("VALIDATION_TO_EMAIL") or getattr(settings, "VALIDATION_TO_EMAIL", "validation@biopathogenix.com")
    else:
        raw = os.environ.get("SUPPORT_TO_EMAIL") or getattr(settings, "SUPPORT_TO_EMAIL", "support@biopathogenix.com")
    return [e.strip() for e in raw.split(",") if e.strip()]


def _send_email(recipients: list[str], subject: str, html_body: str) -> None:
    """Try Microsoft Graph first; fall back to SMTP if Graph fails or is not configured."""
    graph_sender = getattr(settings, "GRAPH_SENDER", None) or getattr(settings, "DEFAULT_FROM_EMAIL", None)
    smtp_sender = getattr(settings, "DEFAULT_FROM_EMAIL", None)

    if getattr(settings, "GRAPH_ENABLED", False):
        try:
            send_graph_email(
                recipients,
                subject,
                html_body=html_body,
                text_body=strip_tags(html_body),
                from_email=graph_sender,
            )
            return
        except Exception:
            logger.warning("Graph email failed — falling back to SMTP")

    # SMTP fallback (used when Graph is not configured or credentials have expired)
    send_mail(
        subject=subject,
        message=strip_tags(html_body),
        from_email=smtp_sender,
        recipient_list=recipients,
        html_message=html_body,
        fail_silently=False,
    )


class ChatView(APIView):
    def post(self, request):
        user_text = request.data.get("userText", "")
        history = request.data.get("history", [])

        if not user_text:
            return Response({"reply": "Please type a message."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reply, _docs, intake_form = answer_chat_request(user_text, history)
            return Response(
                {"reply": reply, "intakeForm": intake_form},
                status=status.HTTP_200_OK,
            )
        except Exception as exc:
            return Response(
                {"reply": "Sorry - AI service failed.", "error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


def _score_pathogen_lookup(name: str, normalized_query: str, tokens: list[str]) -> int:
    if not name or not normalized_query:
        return 0

    score = 0

    if name == normalized_query:
        score += 400
    if name.startswith(normalized_query):
        score += 260
    if normalized_query in name:
        score += 180

    token_matches = sum(1 for token in tokens if token in name)
    score += token_matches * 35

    if len(tokens) > 1 and token_matches == len(tokens):
        score += 100

    return score


class PathogenLookupSearchView(APIView):
    def post(self, request):
        query = str(request.data.get("query") or "").strip()
        if not query:
            return Response({"matched": False, "matches": []}, status=status.HTTP_400_BAD_REQUEST)

        normalized_query = normalize_lookup_text(query)
        tokens = [token for token in normalized_query.split() if token]

        ranked = []
        for entry in PathogenPanelLookup.objects.filter(is_active=True):
            score = _score_pathogen_lookup(entry.normalized_name, normalized_query, tokens)
            if score <= 0:
                continue
            ranked.append((score, entry))

        ranked.sort(key=lambda item: (-item[0], item[1].pathogen_target))

        matches = [
            {
                "pathogenTarget": entry.pathogen_target,
                "panelCount": entry.panel_count,
                "panels": entry.panels,
            }
            for score, entry in ranked[:8]
            if score >= 80
        ]

        return Response(
            {
                "matched": len(matches) > 0,
                "query": query,
                "matches": matches,
            },
            status=status.HTTP_200_OK,
        )


class ContactFormView(APIView):
    def post(self, request):
        data = request.data
        first_name = (data.get("first_name") or "").strip()
        last_name  = (data.get("last_name") or "").strip()
        email      = (data.get("email") or "").strip()
        phone      = (data.get("phone") or "").strip()
        subject    = (data.get("subject") or "").strip()
        message    = (data.get("message") or "").strip()

        if not first_name or not email or not message:
            return Response(
                {"message": "First Name, Email, and Message are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        import html as html_lib
        html_body = f"""
<div style="background:#f6f8fb;padding:20px;font-family:Arial,sans-serif;color:#1f2937;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbe4f0;border-radius:10px;overflow:hidden;">
    <tr>
      <td style="background:#0f4c81;color:#ffffff;padding:16px 20px;font-size:20px;font-weight:700;">
        New Contact Form Submission
      </td>
    </tr>
    <tr>
      <td style="padding:20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #e8eef6;width:200px;font-weight:600;color:#0b3a63;">Name</td><td style="padding:10px 0;border-bottom:1px solid #e8eef6;">{html_lib.escape(first_name)} {html_lib.escape(last_name)}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #e8eef6;font-weight:600;color:#0b3a63;">Email</td><td style="padding:10px 0;border-bottom:1px solid #e8eef6;">{html_lib.escape(email)}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #e8eef6;font-weight:600;color:#0b3a63;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #e8eef6;">{html_lib.escape(phone) or "N/A"}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #e8eef6;font-weight:600;color:#0b3a63;">Subject</td><td style="padding:10px 0;border-bottom:1px solid #e8eef6;">{html_lib.escape(subject) or "N/A"}</td></tr>
        </table>
        <div style="margin-top:18px;padding:14px;background:#f8fbff;border:1px solid #e3edf9;border-radius:8px;">
          <div style="font-weight:600;color:#0b3a63;margin-bottom:6px;">Message</div>
          <div style="white-space:pre-wrap;line-height:1.55;">{html_lib.escape(message)}</div>
        </div>
      </td>
    </tr>
  </table>
</div>"""

        email_subject = f"Contact Form: {subject or 'New Message'} — {first_name} {last_name}"
        recipients = _get_recipients("contact")

        try:
            _send_email(recipients, email_subject, html_body)
        except Exception as exc:
            logger.exception("Failed to send contact form email")
            return Response(
                {"message": "Failed to send message", "error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"message": "Message sent successfully"}, status=status.HTTP_201_CREATED)


class AssayIntakeCreateView(APIView):
    def post(self, request):
        data = request.data

        assay_type = (data.get("assayType") or "").strip()
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()
        phone = (data.get("phone") or "").strip()
        contact_preference = (data.get("contactPreference") or "").strip()
        reason = (data.get("reason") or "").strip()

        if not name or not email or not reason:
            return Response(
                {"message": "Name, Email, and Reason are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if contact_preference == "call" and not phone:
            return Response(
                {"message": "Phone is required when preferred contact is call."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subject = f"New Assay Intake: {assay_type or 'N/A'}"
        html_body = build_assay_intake_email_html(
            assay_type=assay_type or "N/A",
            name=name,
            email=email,
            phone=phone or "N/A",
            contact_preference=contact_preference or "N/A",
            reason=reason,
        )

        recipients = _get_recipients(assay_type)

        try:
            _send_email(recipients, subject, html_body)
        except Exception as exc:
            logger.exception("Failed to send assay intake email")
            return Response(
                {"message": "Failed to send email", "error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "Submitted and emailed successfully"},
            status=status.HTTP_201_CREATED,
        )
