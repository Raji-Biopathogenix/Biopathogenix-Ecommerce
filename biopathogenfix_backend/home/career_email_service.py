import logging
from typing import Iterable, List

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from utils.emailUtil import EmailService

logger = logging.getLogger(__name__)


def _normalize_recipients(raw_recipients) -> List[str]:
    if isinstance(raw_recipients, str):
        recipients = [part.strip() for part in raw_recipients.split(",") if part.strip()]
        return recipients
    if isinstance(raw_recipients, Iterable):
        recipients = [str(part).strip() for part in raw_recipients if str(part).strip()]
        return recipients
    return []


def _candidate_first_name(full_name: str) -> str:
    return (full_name or "").strip().split(" ")[0] or "Candidate"


def _candidate_email_context(application):
    careers_contact = getattr(settings, "CAREERS_RECIPIENT_EMAIL", "careers@biopathogenix.com")
    return {
        "candidate_name": _candidate_first_name(application.full_name),
        "full_name": application.full_name,
        "role_title": application.role.title,
        "careers_contact_email": careers_contact,
    }


def send_internal_career_application_email(application) -> None:
    recipient_setting = getattr(settings, "CAREERS_RECIPIENT_EMAIL", "careers@biopathogenix.com")
    recipients = _normalize_recipients(recipient_setting) or ["careers@biopathogenix.com"]

    subject = f"New Career Application - {application.role.title}"
    context = {
        "role_title": application.role.title,
        "full_name": application.full_name,
        "email": application.email,
        "phone": application.phone or "N/A",
        "linkedin_url": application.linkedin_url or "N/A",
        "message": application.message or "N/A",
        "submitted_at": application.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
    }
    html_body = render_to_string("emails/career_application.html", context)
    text_body = render_to_string("emails/career_application.txt", context)

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        to=recipients,
        reply_to=[application.email],
    )
    email.attach_alternative(html_body, "text/html")
    if application.resume:
        try:
            email.attach_file(application.resume.path)
        except Exception:
            logger.exception(
                "Career application resume could not be attached for application id=%s",
                application.pk,
            )
    email.send(fail_silently=False)


def send_candidate_application_confirmation_email(application) -> None:
    context = _candidate_email_context(application)
    subject = f"We received your application for {application.role.title}"
    EmailService.send_html(
        [application.email],
        subject,
        "emails/career_application_confirmation.html",
        context,
    )


def send_candidate_rejection_email(application) -> None:
    context = _candidate_email_context(application)
    subject = f"Update on your {application.role.title} application"
    EmailService.send_html(
        [application.email],
        subject,
        "emails/career_application_rejected.html",
        context,
    )
