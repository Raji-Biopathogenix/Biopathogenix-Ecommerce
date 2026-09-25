# services/email_service.py

import logging
from urllib.parse import urljoin
from django.core.mail  import EmailMultiAlternatives
from django.template.loader  import render_to_string
from django.conf  import settings
from django.utils import timezone
from config.settings import configSettings
from datetime import datetime, timezone as datetime_timezone
from django.utils.dateparse import parse_datetime, parse_date
from users.models import CustomUser
from services.emailService import send_graph_email

logger = logging.getLogger(__name__)


def _email_date(value):
    """Accept provider timestamps and serialized dates for email date filters."""
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, tz=datetime_timezone.utc)
    if isinstance(value, str):
        value = parse_datetime(value) or parse_date(value)
    return value or timezone.now()


def _order_logo_url():
    # Keep custom branding URLs, but upgrade the legacy monochrome asset.
    return settings.ORDER_EMAIL_LOGO_URL.replace('/images/email-logo.png', '/images/email-logo-color.png')


def _send_confirmation_message(*, to, bcc, subject, html, text):
    sender = settings.DEFAULT_FROM_EMAIL
    if getattr(settings, 'GRAPH_ENABLED', False):
        send_graph_email(to, subject, html_body=html, text_body=text,
                         from_email=sender, bcc_list=bcc)
    else:
        email = EmailMultiAlternatives(subject, text, sender, to, bcc=bcc)
        email.attach_alternative(html, 'text/html')
        email.send(fail_silently=False)


def send_order_confirmation_emails(order):
    """Two different bodies: customer confirmation and internal fulfillment copy."""
    from .packing_slips import address_lines

    try:
        number = f'ORD-{order.id:06d}'
        frontend = (configSettings.FRONTEND_URL or 'https://biopathogenix.com').rstrip('/')
        items = list(order.items.select_related('product').prefetch_related('product__images'))
        context = {
            'logo_url': _order_logo_url(),
            'user_name': f'{order.user.first_name or ""} {order.user.last_name or ""}'.strip(),
            'order_number': number,
            'order_date': order.created_at.strftime('%B %d, %Y'),
            'order_items': items, 'subtotal': order.subtotal,
            'shipping_cost': order.shipping_cost, 'tax_amount': order.tax_amount,
            'coupon_amt': order.coupon_amt, 'total': order.amount,
            'coupon_code': getattr(order, 'coupon_code', ''),
            'payment_method': _format_payment_method(order.payment_method),
            'billing_address': ', '.join(address_lines(order, 'billing')),
            'shipping_address': ', '.join(address_lines(order)),
            'shop_url': f'{frontend}/shop',
            'invoice_note': ('Our team will review your order and send an invoice with payment instructions.'
                             if order.payment_method == 'invoice' else None),
        }
    except Exception:
        logger.exception('Unable to prepare order confirmation for order %s', order.id)
        return

    # Separate try blocks ensure an internal mail failure cannot suppress the
    # customer confirmation (or vice versa). No real recipient is put in CC.
    try:
        customer_context = dict(context, related_products=_get_related_products(order))
        _send_confirmation_message(
            to=_get_order_recipients(order), bcc=[],
            subject=f'Your BioPathogenix Order Confirmation - {number}',
            html=render_to_string('emails/order_confirmation_email.html', customer_context),
            text=f'Thank you for your order {number}. Total: ${order.amount}.',
        )
    except Exception:
        logger.exception('Customer confirmation failed for order %s', order.id)

    try:
        recipients = list(dict.fromkeys(settings.ORDER_NOTIFICATION_BCC))
        if not recipients:
            return
        purchased = []
        for item in items:
            image_url = ''
            if item.product:
                image = item.product.images.filter(is_primary=True).first() or item.product.images.first()
                if image and image.image:
                    image_url = urljoin(settings.BACKEND_URL + '/', image.image.url)
            purchased.append({'name': item.product_name, 'sku': item.sku_code,
                              'quantity': item.quantity, 'total': item.total, 'image_url': image_url})
        edit_url = f'{frontend}/orders/{order.id}/edit'
        internal_context = dict(context, purchased_items=purchased,
            order_edit_url=edit_url, billing_lines=address_lines(order, 'billing'),
            shipping_lines=address_lines(order), contact_email=order.shipping_email or order.user.email,
            contact_phone=order.shipping_phone,
            company_address=settings.PACKING_SLIP_COMPANY_ADDRESS,
            card_brand=order.card_brand, card_last4=order.card_last4)
        _send_confirmation_message(
            to=[], bcc=recipients, subject=f'[BioPathogenix] New order: {number}',
            html=render_to_string('emails/internal_order_confirmation.html', internal_context),
            text=f'New order {number}. Total: ${order.amount}.\nView / edit order and access packing slip (staff sign-in required): {edit_url}',
        )
    except Exception:
        logger.exception('Internal order notification failed for order %s', order.id)


def _get_order_recipients(order):
    to_email = [order.user.email]
    if order.user.laboratory:
        lab_users = CustomUser.objects.filter(laboratory=order.user.laboratory).exclude(id=order.user.id)
        to_email += [lab_user.email for lab_user in lab_users]
    return list(dict.fromkeys(filter(None, to_email)))


def _get_related_products(order, limit: int = 4):
    from product.models import Product

    purchased_product_ids = list(
        order.items.exclude(product_id=None).values_list('product_id', flat=True)
    )
    if limit <= 0:
        return []

    category_ids = Product.objects.filter(
        id__in=purchased_product_ids
    ).values_list('categories__id', flat=True).distinct()

    related = list(
        Product.objects.filter(categories__id__in=list(category_ids), is_active=True)
        .exclude(id__in=purchased_product_ids)
        .distinct()
        .prefetch_related('images')[:limit]
    )
    # Some products have no category peers. Fill remaining spaces from the
    # active catalog, excluding purchased products and those already selected.
    if len(related) < limit:
        excluded_ids = purchased_product_ids + [product.pk for product in related]
        related.extend(
            Product.objects.filter(is_active=True)
            .exclude(id__in=excluded_ids)
            .order_by('-is_featured', 'id')
            .prefetch_related('images')[:limit - len(related)]
        )

    backend_url = getattr(settings, 'BACKEND_URL', '')
    items = []
    for product in related:
        primary_image = product.images.filter(is_primary=True).first() or product.images.first()
        image_url = ''
        if primary_image and primary_image.image:
            # Preserve absolute storage/CDN URLs; resolve local media paths
            # against the public backend origin for recipients outside the site.
            image_url = urljoin(f"{backend_url.rstrip('/')}/", primary_image.image.url)
        items.append({
            'name': product.name,
            'price': product.price,
            'image_url': image_url,
            'product_url': f"{(configSettings.FRONTEND_URL or 'https://biopathogenix.com').rstrip('/')}/product-detail/{product.slug}",
        })
    return items


def send_order_status_email(order, previous_status: str | None = None, notes: str = "") -> bool:
    try:
        support_email = 'order@biopathogenix.com'
        company_name = configSettings.COMPANY_NAME or 'BioPathogenix'

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
            'tracking_url': f"https://www.ups.com/track?tracknum={order.tracking_number}&requester=ST/trackdetails" if order.tracking_number else None,
            'order_url': f"{configSettings.FRONTEND_URL}/my-account/",
            'shop_url': f"{configSettings.FRONTEND_URL}/shop",
            'support_email': support_email,
            'company_name': company_name,
            'logo_url': _order_logo_url(),
            'order_items': order.items.all(),
            'subtotal': order.subtotal,
            'shipping_cost': order.shipping_cost,
            'tax_amount': order.tax_amount,
            'total': order.amount,
            'related_products': _get_related_products(order),
        }

        html_content = render_to_string('order/status_update_email.html', context)
        text_content = (
            f"Order #{context['order_number']} Status Update\n\n"
            f"Hi {context['customer_name']},\n\n"
            f"Your order status is now {context['current_status_display']}.\n"
            + (f"Previous status: {context['previous_status_display']}\n" if context['previous_status_display'] else "")
            + (f"Tracking number: {context['tracking_number']} ({context['tracking_url']})\n" if context['tracking_number'] else "")
            + f"\nView your order: {context['order_url']}\n"
            + f"\nQuestions? {context['support_email']}\n\n"
            + f"{context['company_name']}"
        )

        subject = f"Order #{context['order_number']} Updated to {context['current_status_display']}"
        from_email = f"{company_name} <{configSettings.DEFAULT_FROM_EMAIL}>"
        to_list = _get_order_recipients(order)
        # Internal recipients receive the new-order notification at placement,
        # not a copy of every subsequent customer status update.
        bcc_list = []
        if getattr(settings, 'GRAPH_ENABLED', False):
            # Graph's sendMail wants a bare mailbox address, not a "Name <email>"
            # string -- that display-name format is only valid for the SMTP From header.
            send_graph_email(to_list, subject, html_body=html_content, text_body=text_content, from_email=configSettings.DEFAULT_FROM_EMAIL, bcc_list=bcc_list)
        else:
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=to_list,
                bcc=bcc_list,
                reply_to=[support_email],
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
            'order_number':      f'ORD-{order.id:06d}',
            'logo_url':          _order_logo_url(),
            'order_url':         f"{configSettings.FRONTEND_URL}/orders/{order.id}",

            # Customer
            'customer_name':     order.fullName or 'Valued Customer',

            # Refund
            'refund_amount':     f"{refund_amount:.2f}",
            'is_partial':        is_partial,
            'remaining_amount':  f"{remaining:.2f}",
            'refunded_at':       _email_date(order.refunded_at),
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
            send_graph_email(to_list, subject, html_body=html_content, text_body=text_content, from_email=configSettings.DEFAULT_FROM_EMAIL)
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
        'invoice':       'Invoice',
    }.get(method or '', 'Card')




def send_cancellation_email(order, cancel_data: dict) -> bool:
    try:

        cancelled_at = _email_date(cancel_data.get('cancelled_at'))

        context = {
            'order':         order,
            'order_number':  f'ORD-{order.id:06d}',
            'logo_url':      _order_logo_url(),
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
            send_graph_email(to_list, subject, html_body=html_content, text_body=text_content, from_email=configSettings.DEFAULT_FROM_EMAIL)
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
