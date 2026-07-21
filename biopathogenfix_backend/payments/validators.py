from rest_framework.exceptions import ValidationError


def validate_checkout_payload(data: dict) -> None:
    """
    Validates all required fields for a card checkout.
    Raises ValidationError with a clear message on first failure.
    """

    #  Required shipping fields 
    required_shipping = [
        ("first_name",    "First name"),
        ("last_name",     "Last name"),
        ("email",         "Email"),
        ("address_line1", "Street address"),
        ("city",          "City"),
        ("state",         "State"),
        ("postal_code",   "ZIP code"),
        ("country",       "Country"),
    ]
    for field, label in required_shipping:
        if field == "postal_code":
            shipping_zip =  data['shipping'].get("postal_code", "").strip()
            if not shipping_zip.isdigit() or len(shipping_zip) != 5:
                raise ValidationError("ZIP code must be a valid 5-digit US ZIP code.")
        else:
            if not data['shipping'].get(field, "").strip():
                raise ValidationError(f"Shipping {label} is required.")

    if not data['useSameAddress']:
        for field, label in required_shipping:
            if field == "postal_code":
                billing_zip = data['billing'].get("postal_code", "").strip()
                if not billing_zip.isdigit() or len(billing_zip) != 5:
                    raise ValidationError("Billing ZIP code must be a valid 5-digit US ZIP code.")
            else:
                if not data['billing'].get(field, "").strip():
                    raise ValidationError(f"Billing Address {label} is required.")


    # Amount 
    try:
        amount = float(data.get("amount", 0))
        if amount <= 0:
            raise ValueError
    except (ValueError, TypeError):
        raise ValidationError("Invalid payment amount.")

    # Idempotency key 
    if not data.get("idempotency_key"):
        raise ValidationError("Idempotency key is required.")

    # Card payment specific fields
    if data.get("payment_method") == "card":
        # --- Stripe path (commented out in favor of QuickBooks Payments) ---
        # if not str(data.get("stripe_payment_intent_id", "")).strip():
        #     raise ValidationError("Stripe payment reference is required.")

        required_card_fields = [
            ("card_name",      "Cardholder name"),
            ("card_number",    "Card number"),
            ("card_exp_month", "Card expiration month"),
            ("card_exp_year",  "Card expiration year"),
            ("card_cvv",       "Card security code"),
        ]
        for field, label in required_card_fields:
            if not str(data.get(field, "")).strip():
                raise ValidationError(f"{label} is required.")

