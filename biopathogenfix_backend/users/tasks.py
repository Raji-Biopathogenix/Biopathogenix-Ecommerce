# tasks.py
import logging
from celery import shared_task
from services.emailService import send_graph_email
from django.template.loader import render_to_string
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_verification_email(self, email, context):
    try:
        context = dict(context or {})
        context.setdefault("logo_url", settings.WELCOME_LOGO_URL)
        subject = context.get("subject", "Verification Email From BioPathogenix")
        html_message = render_to_string("verification_email.html", context)
        plain_message = render_to_string("welcome.txt", context)
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "example@example.com")

        if getattr(settings, "GRAPH_ENABLED", False):
            send_graph_email([email], subject, html_body=html_message, text_body=plain_message, from_email=from_email)
        else:
            send_mail(subject, plain_message, from_email, [email], html_message=html_message, fail_silently=False)

        logger.info("Verification email sent to %s", email)
        return {"status": "sent", "to": email}

    except Exception as exc:
        logger.exception("Failed to send verification email to %s: %s", email, exc)
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error("Max retries exceeded for sending verification email to %s", email)
            return {"status": "failed", "to": email, "error": str(exc)}


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_activation_admin_email(self, email, context):
    try:
        context = dict(context or {})
        context.setdefault("logo_url", settings.WELCOME_LOGO_URL)
        subject = context.get("subject", "Verification Email From BioPathogenix")
        html_message = render_to_string("admin_verified_mail.html", context)
        plain_message = render_to_string("welcome.txt", context)
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "example@example.com")

        if getattr(settings, "GRAPH_ENABLED", False):
            send_graph_email([email], subject, html_body=html_message, text_body=plain_message, from_email=from_email)
        else:
            send_mail(subject, plain_message, from_email, [email], html_message=html_message, fail_silently=False)

        logger.info("Verification email sent to %s", email)
        return {"status": "sent", "to": email}

    except Exception as exc:
        logger.exception("Failed to send verification email to %s: %s", email, exc)
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error("Max retries exceeded for sending verification email to %s", email)
            return {"status": "failed", "to": email, "error": str(exc)}



@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_activation_user_email(self, email, context):
    try:
        context = dict(context or {})
        context.setdefault("logo_url", settings.WELCOME_LOGO_URL)
        subject = context.get("subject", "Verification Email From BioPathogenix")
        html_message = render_to_string("user_verified_mail.html", context)
        plain_message = render_to_string("welcome.txt", context)
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "example@example.com")

        if getattr(settings, "GRAPH_ENABLED", False):
            send_graph_email([email], subject, html_body=html_message, text_body=plain_message, from_email=from_email)
        else:
            send_mail(subject, plain_message, from_email, [email], html_message=html_message, fail_silently=False)

        logger.info("Verification email sent to %s", email)
        return {"status": "sent", "to": email}
    except Exception as exc:
        logger.exception("Failed to send verification email to %s: %s", email, exc)
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error("Max retries exceeded for sending verification email to %s", email)
            return {"status": "failed", "to": email, "error": str(exc)}


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_welcome_email(self, email, context):
    try:
        context = dict(context or {})
        context.setdefault("logo_url", settings.WELCOME_LOGO_URL)
        subject = context.get("subject", "Welcome to BioPathogenix")
        html_message = render_to_string("welcome_email_template.html", context)
        plain_message = render_to_string("welcome.txt", context)

        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@example.com")

        if getattr(settings, "GRAPH_ENABLED", False):
            send_graph_email(
                [email],
                subject,
                html_body=html_message,
                text_body=plain_message,
                from_email=from_email,
            )
        else:
            send_mail(
                subject,
                plain_message,
                from_email,
                [email],
                html_message=html_message,
                fail_silently=False,
            )

        logger.info("Welcome email queued/sent to %s", email)
        return {"status": "sent", "to": email}

    except Exception as exc:
        logger.exception("Failed to send welcome email to %s: %s", email, exc)
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error("Max retries exceeded for sending welcome email to %s", email)
            return {"status": "failed", "to": email, "error": str(exc)}
