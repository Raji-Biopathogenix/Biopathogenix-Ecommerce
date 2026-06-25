import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from payments.stripe_utils import ensure_stripe_configured, get_stripe_client, get_stripe_publishable_key

logger = logging.getLogger(__name__)


def _get_user_display_name(user) -> str:
    full_name = getattr(user, "get_full_name", "") or ""
    if full_name:
        return full_name
    return user.email


def _get_or_create_customer(user):
    client = get_stripe_client()
    customer_id = (user.stripe_customer_id or "").strip()
    if customer_id:
        return customer_id

    customer = client.customers.create(
        params={
            "email": user.email,
            "name": _get_user_display_name(user),
            "metadata": {"user_id": user.id},
        }
    )
    user.stripe_customer_id = customer.id
    user.save(update_fields=["stripe_customer_id"])
    return customer.id


def _get_default_payment_method_id(customer):
    invoice_settings = getattr(customer, "invoice_settings", None)
    default_pm = getattr(invoice_settings, "default_payment_method", None)
    if hasattr(default_pm, "id"):
        return default_pm.id
    return default_pm or ""


def _serialize_payment_method(payment_method, default_payment_method_id: str):
    card = getattr(payment_method, "card", None)
    billing_details = getattr(payment_method, "billing_details", None)
    return {
        "id": payment_method.id,
        "brand": getattr(card, "brand", "") if card else "",
        "last4": getattr(card, "last4", "") if card else "",
        "exp_month": getattr(card, "exp_month", None) if card else None,
        "exp_year": getattr(card, "exp_year", None) if card else None,
        "fingerprint": getattr(card, "fingerprint", "") if card else "",
        "country": getattr(card, "country", "") if card else "",
        "name": getattr(billing_details, "name", "") if billing_details else "",
        "is_default": payment_method.id == default_payment_method_id,
    }


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_setup_intent(request):
    try:
        ensure_stripe_configured()
        client = get_stripe_client()
        customer_id = _get_or_create_customer(request.user)
        setup_intent = client.setup_intents.create(
            params={
                "customer": customer_id,
                "payment_method_types": ["card"],
                "usage": "off_session",
            }
        )
        return Response(
            {
                "status": "success",
                "client_secret": setup_intent.client_secret,
                "customer_id": customer_id,
            }
        )
    except Exception as exc:
        logger.exception("Failed to create Stripe setup intent: %s", exc)
        return Response(
            {"status": "error", "message": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )


def _to_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_payment_intent(request):
    try:
        ensure_stripe_configured()
        client = get_stripe_client()

        try:
            amount = float(request.data.get("amount", 0))
        except (TypeError, ValueError):
            amount = 0

        if amount <= 0:
            return Response(
                {"status": "error", "message": "Invalid payment amount."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        save_payment_method = _to_bool(request.data.get("save_payment_method"))
        payment_method_id = (request.data.get("payment_method_id") or "").strip()
        idempotency_key = (request.data.get("idempotency_key") or "").strip()

        customer_id = ""
        if save_payment_method or payment_method_id or (request.user.stripe_customer_id or "").strip():
            customer_id = _get_or_create_customer(request.user)

        params = {
            "amount": int(round(amount * 100)),
            "currency": "usd",
            "payment_method_types": ["card"],
            "metadata": {
                "user_id": str(request.user.id),
                "payment_flow": "checkout",
                "idempotency_key": idempotency_key,
            },
        }

        if customer_id:
            params["customer"] = customer_id
        if payment_method_id:
            params["payment_method"] = payment_method_id
        if save_payment_method:
            params["setup_future_usage"] = "off_session"

        payment_intent = client.payment_intents.create(params=params)

        return Response(
            {
                "status": "success",
                "payment_intent_id": payment_intent.id,
                "client_secret": payment_intent.client_secret,
                "customer_id": customer_id,
            }
        )
    except Exception as exc:
        logger.exception("Failed to create Stripe payment intent: %s", exc)
        return Response(
            {"status": "error", "message": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_payment_methods(request):
    try:
        ensure_stripe_configured()
        client = get_stripe_client()
        customer_id = (request.user.stripe_customer_id or "").strip()
        if not customer_id:
            return Response({"status": "success", "result": {"data": []}})

        customer = client.customers.retrieve(customer_id)
        default_payment_method_id = _get_default_payment_method_id(customer)
        payment_methods = client.payment_methods.list(
            params={"customer": customer_id, "type": "card"}
        )

        data = [
            _serialize_payment_method(pm, default_payment_method_id)
            for pm in payment_methods.data
        ]
        return Response({"status": "success", "result": {"data": data}})
    except Exception as exc:
        logger.exception("Failed to list Stripe payment methods: %s", exc)
        return Response(
            {"status": "error", "message": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_payment_method(request):
    try:
        ensure_stripe_configured()
        client = get_stripe_client()
        payment_method_id = (request.data.get("payment_method_id") or "").strip()
        if not payment_method_id:
            return Response(
                {"status": "error", "message": "payment_method_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer_id = _get_or_create_customer(request.user)
        payment_method = client.payment_methods.retrieve(payment_method_id)
        attached_customer = getattr(payment_method, "customer", None)

        if hasattr(attached_customer, "id"):
            attached_customer = attached_customer.id

        if attached_customer and attached_customer != customer_id:
            return Response(
                {"status": "error", "message": "This card is attached to another customer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not attached_customer:
            client.payment_methods.attach(
                payment_method_id,
                params={"customer": customer_id},
            )
            payment_method = client.payment_methods.retrieve(payment_method_id)

        existing_methods = client.payment_methods.list(
            params={"customer": customer_id, "type": "card"}
        )

        final_payment_method = payment_method
        new_fingerprint = getattr(getattr(payment_method, "card", None), "fingerprint", "")
        for existing in existing_methods.data:
            if existing.id == payment_method.id:
                continue
            existing_fingerprint = getattr(getattr(existing, "card", None), "fingerprint", "")
            if new_fingerprint and new_fingerprint == existing_fingerprint:
                try:
                    client.payment_methods.detach(payment_method.id)
                except Exception:
                    logger.warning("Could not detach duplicate Stripe payment method %s", payment_method.id)
                final_payment_method = existing
                break

        client.customers.update(
            customer_id,
            params={
                "invoice_settings": {
                    "default_payment_method": final_payment_method.id,
                }
            },
        )
        customer = client.customers.retrieve(customer_id)
        default_payment_method_id = _get_default_payment_method_id(customer)

        return Response(
            {
                "status": "success",
                "message": "Payment method saved successfully.",
                "result": {
                    "data": _serialize_payment_method(
                        final_payment_method,
                        default_payment_method_id,
                    )
                },
            }
        )
    except Exception as exc:
        logger.exception("Failed to save Stripe payment method: %s", exc)
        return Response(
            {"status": "error", "message": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
def stripe_config(request):
    """
    Public Stripe configuration endpoint.
    Only exposes the publishable key so the frontend can initialize Stripe
    from admin-managed settings when available.
    """
    return Response(
        {
            "status": "success",
            "result": {
                "data": {
                    "publishable_key": get_stripe_publishable_key(),
                }
            },
        }
    )
