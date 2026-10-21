import logging
import mimetypes
import os
from typing import Iterable, List

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from services.emailService import send_graph_email
from utils.emailUtil import EmailService
from .models import CareerApplication
from utils.form_recipients import website_recipients, form_bcc

logger = logging.getLogger(__name__)


def _normalize_recipients(raw_recipients) -> List[str]:
    if isinstance(raw_recipients, str):
        recipients = [part.strip() for part in raw_recipients.split(",") if part.strip()]
        return recipients
    if isinstance(raw_recipients, Iterable):
        recipients = [str(part).strip() for part in raw_recipients if str(part).strip()]
        return recipients
    return []


def _role_title(application) -> str:
    """The applied-for role, or "General Application" for a resume sent without one."""
    role = getattr(application, "role", None)
    return role.title if role else CareerApplication.GENERAL_APPLICATION_TITLE


def _candidate_first_name(full_name: str) -> str:
    return (full_name or "").strip().split(" ")[0] or "Candidate"


def _candidate_email_context(application):
    careers_contact = getattr(settings, "CAREERS_RECIPIENT_EMAIL", "careers@biopathogenix.com")
    return {
        "candidate_name": _candidate_first_name(application.full_name),
        "full_name": application.full_name,
        "role_title": _role_title(application),
        "careers_contact_email": careers_contact,
    }


def send_internal_career_application_email(application) -> None:
    recipient_setting = getattr(settings, "CAREERS_RECIPIENT_EMAIL", "careers@biopathogenix.com")
    recipients = website_recipients(recipient_setting, "careers@biopathogenix.com")

    subject = f"New Career Application - {_role_title(application)}"
    context = {
        "role_title": _role_title(application),
        "full_name": application.full_name,
        "email": application.email,
        "phone": application.phone or "N/A",
        "linkedin_url": application.linkedin_url or "N/A",
        "message": application.message or "N/A",
        "submitted_at": application.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
    }
    html_body = render_to_string("emails/career_application.html", context)
    text_body = render_to_string("emails/career_application.txt", context)
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None)
    bcc = form_bcc(recipients, getattr(settings, "CAREERS_BCC_EMAIL", ""))

    attachments = []
    if application.resume:
        try:
            with application.resume.open("rb") as resume_file:
                attachments.append(
                    {
                        "name": os.path.basename(application.resume.name),
                        "content": resume_file.read(),
                        "content_type": mimetypes.guess_type(application.resume.name)[0],
                    }
                )
        except Exception:
            logger.exception(
                "Career application resume could not be attached for application id=%s",
                application.pk,
            )

    # Like the other website forms: Microsoft Graph when it is configured, otherwise SMTP.
    if getattr(settings, "GRAPH_ENABLED", False):
        send_graph_email(
            recipients,
            subject,
            html_body=html_body,
            text_body=text_body,
            from_email=from_email,
            bcc_list=bcc,
            attachments=attachments,
            reply_to=[application.email],
        )
        return

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=from_email,
        to=recipients,
        bcc=bcc,
        reply_to=[application.email],
    )
    email.attach_alternative(html_body, "text/html")
    for attachment in attachments:
        email.attach(attachment["name"], attachment["content"], attachment["content_type"])
    email.send(fail_silently=False)


def send_candidate_application_confirmation_email(application) -> None:
    context = _candidate_email_context(application)
    subject = f"We received your application for {_role_title(application)}"
    EmailService.send_html(
        [application.email],
        subject,
        "emails/career_application_confirmation.html",
        context,
    )


def send_candidate_rejection_email(application) -> None:
    context = _candidate_email_context(application)
    subject = f"Update on your {_role_title(application)} application"
    EmailService.send_html(
        [application.email],
        subject,
        "emails/career_application_rejected.html",
        context,
    )
