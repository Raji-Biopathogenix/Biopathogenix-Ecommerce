try:
    import stripe
except ModuleNotFoundError:
    stripe = None

from config.settings import configSettings
from payments.models import StripeConfig


def _get_admin_stripe_config():
    try:
        return StripeConfig.objects.first()
    except Exception:
        return None


def get_stripe_secret_key() -> str:
    admin_config = _get_admin_stripe_config()
    if admin_config and admin_config.enabled:
        secret_key = (admin_config.secret_key or "").strip()
        if secret_key:
            return secret_key
    return (getattr(configSettings, "STRIPE_SECRET_KEY", "") or "").strip()


def get_stripe_publishable_key() -> str:
    admin_config = _get_admin_stripe_config()
    if admin_config and admin_config.enabled:
        publishable_key = (admin_config.publishable_key or "").strip()
        if publishable_key:
            return publishable_key
    return (getattr(configSettings, "STRIPE_PUBLISHABLE_KEY", "") or "").strip()


def get_stripe_client():
    secret_key = get_stripe_secret_key()
    if not stripe or not secret_key:
        return None
    return stripe.StripeClient(api_key=secret_key)


def ensure_stripe_configured():
    if stripe is None:
        raise RuntimeError(
            "Stripe SDK is not installed. Run `pip install stripe` in the backend virtual environment."
        )
    if not get_stripe_secret_key():
        raise RuntimeError("Stripe is not configured.")
    if get_stripe_client() is None:
        raise RuntimeError("Stripe client could not be initialized.")


def verify_checkout_payment_intent(payment_intent_id: str, expected_amount: float, user):
    ensure_stripe_configured()
    if not payment_intent_id:
        raise ValueError("Stripe payment reference is required.")

    client = get_stripe_client()
    payment_intent = client.payment_intents.retrieve(
        payment_intent_id,
        options={"expand": ["payment_method"]},
    )

    if payment_intent.status != "succeeded":
        raise ValueError("Stripe payment has not completed successfully.")

    metadata = getattr(payment_intent, "metadata", None) or {}
    metadata_user_id = str(metadata.get("user_id", "")).strip()
    if metadata_user_id and metadata_user_id != str(user.id):
        raise ValueError("Stripe payment does not belong to the current user.")

    received_amount = (getattr(payment_intent, "amount_received", 0) or 0) / 100
    if round(received_amount, 2) != round(float(expected_amount or 0), 2):
        raise ValueError("Stripe payment amount does not match the checkout total.")

    payment_method = getattr(payment_intent, "payment_method", None)
    if isinstance(payment_method, str):
        payment_method = client.payment_methods.retrieve(payment_method)

    card = getattr(payment_method, "card", None) if payment_method else None
    billing_details = getattr(payment_method, "billing_details", None) if payment_method else None

    return {
        "transaction_id": payment_intent.id,
        "payment_method_id": getattr(payment_method, "id", ""),
        "card_last4": getattr(card, "last4", "") if card else "",
        "card_brand": getattr(card, "brand", "") if card else "",
        "card_name": getattr(billing_details, "name", "") if billing_details else "",
    }


def refund_stripe_payment(payment_intent_id: str, amount: float):
    ensure_stripe_configured()
    client = get_stripe_client()
    refund = client.refunds.create(
        params={
            "payment_intent": payment_intent_id,
            "amount": int(round(float(amount) * 100)),
        }
    )

    return {
        "id": refund.id,
        "status": refund.status,
        "created": refund.created,
    }
