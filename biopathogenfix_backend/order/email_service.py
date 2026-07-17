# services/email_service.py

import logging
from django.core.mail  import EmailMultiAlternatives
from django.template.loader  import render_to_string
from django.conf  import settings
from django.utils import timezone
from config.settings import configSettings
from datetime import datetime
from users.models import CustomUser
from services.emailService import send_graph_email

logger = logging.getLogger(__name__)


def _get_order_recipients(order):
    to_email = [order.user.email]
    if order.user.laboratory:
        lab_users = CustomUser.objects.filter(laboratory=order.user.laboratory).exclude(id=order.user.id)
        to_email += [lab_user.email for lab_user in lab_users]
    return list(dict.fromkeys(filter(None, to_email)))


def send_order_status_email(order, previous_status: str | None = None, notes: str = "") -> bool:
    try:
        context = {
            'order': order,
            'customer_name': order.fullName or order.user.get_full_name() or 'Valued Customer',
            'order_number': f"ORD-{order.id:06d}",
            'previous_status': previous_status,
            'previous_status_display': dict(order.STATUS_CHOICES).get(previous_status, ''),
            'current_status': order.status,
            'current_status_display': order.get_status_display(),
            'status_notes': notes,
            'tracking_number': order.tracking_number,
            'order_url': f"{configSettings.FRONTEND_URL}/my-account/",
            'support_email': configSettings.SUPPORT_EMAIL,
            'company_name': configSettings.COMPANY_NAME,
        }

        html_content = render_to_string('order/status_update_email.html', context)
        text_content = (
            f"Order #{context['order_number']} Status Update\n\n"
            f"Hi {context['customer_name']},\n\n"
            f"Your order status is now {context['current_status_display']}.\n"
            + (f"Previous status: {context['previous_status_display']}\n" if context['previous_status_display'] else "")
            + (f"Tracking number: {context['tracking_number']}\n" if context['tracking_number'] else "")
            + f"\nView your order: {context['order_url']}\n"
            + f"\nQuestions? {context['support_email']}\n\n"
            + f"{context['company_name']}"
        )

        subject = f"Order #{context['order_number']} Updated to {context['current_status_display']}"
        from_email = f"{configSettings.COMPANY_NAME} <{configSettings.DEFAULT_FROM_EMAIL}>"
        to_list = _get_order_recipients(order)
        if getattr(settings, 'GRAPH_ENABLED', False):
            send_graph_email(to_list, subject, html_body=html_content, text_body=text_content, from_email=from_email)
        else:
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=to_list,
                reply_to=[configSettings.SUPPORT_EMAIL],
            )
            email.attach_alternative(html_content, 'text/html')
            email.send(fail_silently=False)

        logger.info("Order status email sent for order #%s", order.id)
        return True
    except Exception as e:
        logger.error("Order status email failed for order #%s: %s", order.id, e)
        return False


def send_refund_email(order, refund_data: dict) -> bool:
    try:
        refund_amount = float(refund_data.get('refund_amount', 0))
        total_amount  = float(order.amount)
        is_partial    = refund_amount < total_amount
        remaining     = round(total_amount - refund_amount, 2)

        # Build context 
        context = {
            # Order
            'order':             order,
            'order_url':         f"{configSettings.FRONTEND_URL}/orders/{order.id}",

            # Customer
            'customer_name':     order.fullName or 'Valued Customer',

            # Refund
            'refund_amount':     f"{refund_amount:.2f}",
            'is_partial':        is_partial,
            'remaining_amount':  f"{remaining:.2f}",
            'refunded_at':       order.refunded_at or timezone.now(),
            'refund_reference':  refund_data.get('refund_reference', ''),
            'payment_method':    _format_payment_method(order.payment_method),

            # Company
            'company_name':    configSettings.COMPANY_NAME,
            'company_address': configSettings.COMPANY_ADDRESS,
            'support_email':   configSettings.SUPPORT_EMAIL,
            'support_url':     configSettings.SUPPORT_URL,
            'privacy_url':     f"{configSettings.FRONTEND_URL}/privacy",
            'terms_url':       f"{configSettings.FRONTEND_URL}/terms",
        }

        # Render HTML 
        html_content = render_to_string('order/refund_email.html', context)

        # Plain text fallback 
        text_content = (
            f"Refund Confirmed — Order #{order.id}\n\n"
            f"Hi {context['customer_name']},\n\n"
            f"Your refund of ${context['refund_amount']} has been processed.\n"
            f"It will appear in your account within 3–7 business days.\n\n"
            f"Order: #{order.id}\n"
            f"Amount: ${context['refund_amount']}"
            f"{'(Partial)' if is_partial else ''}\n"
            f"Date: {context['refunded_at']}\n"
            + (f"Reference: {context['refund_reference']}\n" if context['refund_reference'] else "")
            + f"\nView order: {context['order_url']}\n\n"
            f"Questions? {configSettings.SUPPORT_EMAIL}\n\n"
            f"— {configSettings.COMPANY_NAME}"
        )

        # Subject 
        subject = (
            f"Refund of ${refund_amount:.2f} Confirmed "
            f"— Order #{order.id}"
        )

        # Send
        from_email = f"{configSettings.COMPANY_NAME} <{configSettings.DEFAULT_FROM_EMAIL}>"
        to_list = _get_order_recipients(order)
        if getattr(settings, 'GRAPH_ENABLED', False):
            send_graph_email(to_list, subject, html_body=html_content, text_body=text_content, from_email=from_email)
        else:
            email = EmailMultiAlternatives(
                subject = subject,
                body = text_content,
                from_email = from_email,
                to = to_list,
                reply_to = [configSettings.SUPPORT_EMAIL],
            )
            email.attach_alternative(html_content, 'text/html')
            email.send(fail_silently=False)

        logger.info(f"Refund email sent for order #{order.id} to {order.user.email}")
        return True

    except Exception as e:
        logger.error(f"Refund email failed for order #{order.id}: {e}")
        return False


def _format_payment_method(method: str) -> str:
    return {
        'card':          'Credit / Debit Card',
    }.get(method or '', 'Card')




def send_cancellation_email(order, cancel_data: dict) -> bool:
    try:

        cancelled_at = cancel_data.get('cancelled_at','')
        # if isinstance(cancelled_at, str):
        #     cancelled_at = datetime.fromisoformat(cancelled_at.replace('Z', '+00:00'))
        # if not cancelled_at:
        #     cancelled_at = timezone.now()

        context = {
            'order':         order,
            'order_url':     f"{configSettings.FRONTEND_URL}/my-account/",
            'shop_url':      configSettings.FRONTEND_URL,

            'customer_name': order.fullName or 'Valued Customer',

            'cancelled_at':  cancelled_at,
            'cancel_notes':  cancel_data.get('cancel_reason',''),            

            'company_name':    configSettings.COMPANY_NAME,
            'company_address': configSettings.COMPANY_ADDRESS,
            'support_email':   configSettings.SUPPORT_EMAIL,

            'total_amount': order.amount,
        }

        html_content = render_to_string('order/cancellation_email.html', context)

        text_content = (
            f"Order Cancelled — #{order.id}\n\n"
            f"Hi {context['customer_name']},\n\n"
            f"Your Order #{order.id} has been cancelled.\n\n"
            f"Date:   {cancelled_at}\n"
            f"Total:  ${order.amount}\n\n"
            f"If you were charged, a refund will appear in 3–7 business days.\n\n"
            f"Questions? {configSettings.SUPPORT_EMAIL}\n\n"
            f"— {configSettings.COMPANY_NAME}"
        )

        subject = f"Order #{order.id} Cancelled — {configSettings.COMPANY_NAME}"
        from_email = f"{configSettings.COMPANY_NAME} <{configSettings.DEFAULT_FROM_EMAIL}>"
        to_list = _get_order_recipients(order)
        if getattr(settings, 'GRAPH_ENABLED', False):
            send_graph_email(to_list, subject, html_body=html_content, text_body=text_content, from_email=from_email)
        else:
            email = EmailMultiAlternatives(
                subject    = subject,
                body       = text_content,
                from_email = from_email,
                to         = to_list,
                reply_to   = [configSettings.SUPPORT_EMAIL],
            )
            email.attach_alternative(html_content, 'text/html')
            email.send(fail_silently=False)

        logger.info(
            f"Cancellation email sent for order #{order.id} "
            f"to {order.user.email}"
        )
        return True

    except Exception as e:
        logger.error(
            f"Cancellation email failed for order #{order.id}: {e}"
        )
        return False
