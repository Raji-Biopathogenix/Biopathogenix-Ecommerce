from decimal import Decimal, ROUND_HALF_UP

import requests
import logging
from django.conf import settings
from country.models import Country, State

logger = logging.getLogger(__name__)

# Estimated state-level fallback tax rates (fractional form).
# Used only when TaxConfig provider is explicitly set to "fallback".
US_STATE_TAX_RATES = {
    "AL": Decimal("0.0400"),
    "AK": Decimal("0.0000"),
    "AZ": Decimal("0.0560"),
    "AR": Decimal("0.0650"),
    "CA": Decimal("0.0725"),
    "CO": Decimal("0.0290"),
    "CT": Decimal("0.0635"),
    "DE": Decimal("0.0000"),
    "FL": Decimal("0.0600"),
    "GA": Decimal("0.0400"),
    "HI": Decimal("0.0400"),
    "ID": Decimal("0.0600"),
    "IL": Decimal("0.0625"),
    "IN": Decimal("0.0700"),
    "IA": Decimal("0.0600"),
    "KS": Decimal("0.0650"),
    "KY": Decimal("0.0600"),
    "LA": Decimal("0.0445"),
    "ME": Decimal("0.0550"),
    "MD": Decimal("0.0600"),
    "MA": Decimal("0.0625"),
    "MI": Decimal("0.0600"),
    "MN": Decimal("0.0688"),
    "MS": Decimal("0.0700"),
    "MO": Decimal("0.0423"),
    "MT": Decimal("0.0000"),
    "NE": Decimal("0.0550"),
    "NV": Decimal("0.0685"),
    "NH": Decimal("0.0000"),
    "NJ": Decimal("0.0663"),
    "NM": Decimal("0.0500"),
    "NY": Decimal("0.0400"),
    "NC": Decimal("0.0475"),
    "ND": Decimal("0.0500"),
    "OH": Decimal("0.0575"),
    "OK": Decimal("0.0450"),
    "OR": Decimal("0.0000"),
    "PA": Decimal("0.0600"),
    "RI": Decimal("0.0700"),
    "SC": Decimal("0.0600"),
    "SD": Decimal("0.0450"),
    "TN": Decimal("0.0700"),
    "TX": Decimal("0.0625"),
    "UT": Decimal("0.0610"),
    "VT": Decimal("0.0600"),
    "VA": Decimal("0.0530"),
    "WA": Decimal("0.0650"),
    "WV": Decimal("0.0600"),
    "WI": Decimal("0.0500"),
    "WY": Decimal("0.0400"),
    "DC": Decimal("0.0600"),
}


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _extract_taxjar_error_message(response: requests.Response | None) -> str:
    if response is None:
        return "Unknown TaxJar error."
    try:
        payload = response.json()
        if isinstance(payload, dict):
            for key in ("error", "detail", "message"):
                value = payload.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()
    except Exception:
        pass
    raw = (response.text or "").strip()
    return raw[:300] if raw else "Unknown TaxJar error."


def _humanize_taxjar_error(detail: str) -> str:
    lower = (detail or "").lower()
    if ("zip" in lower and "state" in lower) or ("to_zip" in lower and "to_state" in lower):
        return "Shipping ZIP code and state do not match. Please correct the address."
    if "unauthorized" in lower or "authentication" in lower or "invalid api key" in lower:
        return "TaxJar authentication failed. Please verify API key and sandbox/live mode."
    if "nexus" in lower:
        return "TaxJar nexus configuration is invalid. Please verify Tax Config nexus fields."
    return f"TaxJar quote failed: {detail}"


def _resolve_country_code(raw_country: str) -> str:
    value = str(raw_country or "").strip()
    if not value:
        return "US"

    if value.isdigit():
        country = Country.objects.filter(id=int(value)).only("code").first()
        if country and country.code:
            return country.code.upper()

    if len(value) <= 3 and value.isalpha():
        return value.upper()

    country = Country.objects.filter(name__iexact=value).only("code").first()
    if country and country.code:
        return country.code.upper()

    return value.upper()


def _resolve_state_code(raw_state: str) -> str:
    value = str(raw_state or "").strip()
    if not value:
        return ""

    if value.isdigit():
        state = State.objects.filter(id=int(value)).only("code").first()
        if state and state.code:
            return state.code.upper()

    if len(value) <= 3 and value.isalpha():
        return value.upper()

    state = State.objects.filter(name__iexact=value).only("code").first()
    if state and state.code:
        return state.code.upper()

    return value.upper()


def _normalize_us_zip(raw_zip: str) -> tuple[str, str]:
    digits = "".join(ch for ch in str(raw_zip or "") if ch.isdigit())
    if len(digits) == 5:
        return digits, digits
    if len(digits) == 9:
        return digits[:5], f"{digits[:5]}-{digits[5:]}"
    raise ValueError("ZIP code must be 5 digits or ZIP+4 format")


def _get_runtime_tax_config() -> dict:
    """
    Priority:
    1) Django Admin singleton TaxConfig
    2) settings.py / .env values
    """
    provider = "taxjar"
    enabled = True
    api_key = str(getattr(settings, "TAXJAR_API_KEY", "") or "").strip()
    use_sandbox = bool(getattr(settings, "TAXJAR_USE_SANDBOX", True))
    nexus_country = getattr(settings, "TAX_NEXUS_COUNTRY", "US")
    nexus_zip = getattr(settings, "TAX_NEXUS_ZIP", "40356")
    nexus_state = getattr(settings, "TAX_NEXUS_STATE", "KY")
    nexus_city = getattr(settings, "TAX_NEXUS_CITY", "Nicholasville")
    nexus_street = getattr(settings, "TAX_NEXUS_STREET", "120 Dewey Drive")

    try:
        from payments.models import TaxConfig

        admin_cfg = TaxConfig.get()
        if admin_cfg:
            provider = admin_cfg.provider
            enabled = admin_cfg.enabled
            api_key = (admin_cfg.api_key or "").strip()
            use_sandbox = admin_cfg.use_sandbox
            nexus_country = admin_cfg.nexus_country
            nexus_zip = admin_cfg.nexus_zip
            nexus_state = admin_cfg.nexus_state
            nexus_city = admin_cfg.nexus_city
            nexus_street = admin_cfg.nexus_street
    except Exception:
        # Keep settings/env defaults if admin model is unavailable.
        pass

    api_base = "https://api.sandbox.taxjar.com" if use_sandbox else "https://api.taxjar.com"

    return {
        "provider": provider,
        "enabled": enabled,
        "api_key": api_key,
        "api_base": api_base,
        "nexus_country": nexus_country,
        "nexus_zip": nexus_zip,
        "nexus_state": nexus_state,
        "nexus_city": nexus_city,
        "nexus_street": nexus_street,
    }


def calculate_tax_and_shipping(
    *,
    subtotal: Decimal,
    shipping_state: str,
    shipping_country: str,
    shipping_postal_code: str,
    shipping_city: str = "",
    shipping_address_line1: str = "",
    item_quantity: int,
) -> dict:
    zip5, provider_zip = _normalize_us_zip(shipping_postal_code)

    country_code = _resolve_country_code(shipping_country)
    state_code = _resolve_state_code(shipping_state)

    safe_subtotal = Decimal(subtotal or 0)
    quantity = max(int(item_quantity or 0), 0)
    shipping_cost = _quantize_money(Decimal("20.00") * Decimal(quantity))
    cfg = _get_runtime_tax_config()

    tax_rate = Decimal("0.0000")
    tax_amount = Decimal("0.00")
    provider = "none"
    county = ""

    if country_code == "US" and cfg["enabled"]:
        if cfg["provider"] == "taxjar":
            if not cfg["api_key"]:
                logger.warning("TaxJar quote blocked: missing API key in TaxConfig/settings.")
                raise ValueError("TaxJar is not configured. Please contact support.")
            try:
                tax_amount, tax_rate, county = _calculate_with_taxjar(
                    api_key=cfg["api_key"],
                    api_base=cfg["api_base"],
                    nexus_country=cfg["nexus_country"],
                    nexus_zip=cfg["nexus_zip"],
                    nexus_state=cfg["nexus_state"],
                    nexus_city=cfg["nexus_city"],
                    nexus_street=cfg["nexus_street"],
                    subtotal=safe_subtotal,
                    shipping_cost=shipping_cost,
                    to_state=state_code,
                    to_zip=provider_zip,
                    to_country=country_code,
                    to_city=shipping_city,
                    to_street=shipping_address_line1,
                )
                provider = "taxjar"
            except requests.HTTPError as exc:
                status_code = exc.response.status_code if exc.response is not None else "unknown"
                detail = _extract_taxjar_error_message(exc.response)
                logger.error(
                    "TaxJar HTTP error while quoting tax | status=%s | to_state=%s | to_zip=%s | detail=%s",
                    status_code,
                    state_code,
                    provider_zip,
                    detail,
                )
                raise ValueError(_humanize_taxjar_error(detail)) from exc
            except requests.RequestException as exc:
                logger.error(
                    "TaxJar network/request error while quoting tax | to_state=%s | to_zip=%s | error=%s",
                    state_code,
                    provider_zip,
                    exc,
                )
                raise ValueError("Unable to calculate tax from TaxJar right now. Please try again.") from exc
            except Exception as exc:
                logger.exception(
                    "Unexpected TaxJar quote error | to_state=%s | to_zip=%s",
                    state_code,
                    provider_zip,
                )
                raise ValueError("Unable to calculate tax from TaxJar. Please verify shipping address.") from exc
        elif cfg["provider"] == "fallback":
            tax_rate = US_STATE_TAX_RATES.get(state_code, Decimal("0.0000"))
            tax_amount = _quantize_money(safe_subtotal * tax_rate)
            provider = "fallback"
        else:
            raise ValueError("Unsupported tax provider configuration.")

    total = _quantize_money(safe_subtotal + tax_amount + shipping_cost)

    return {
        "tax_rate": float(tax_rate),
        "tax_amount": float(tax_amount),
        "shipping_cost": float(shipping_cost),
        "total": float(total),
        "state_code": state_code,
        "country_code": country_code,
        "postal_code": zip5,
        "county": county,
        "provider": provider,
    }


def _calculate_with_taxjar(
    *,
    api_key: str,
    api_base: str,
    nexus_country: str,
    nexus_zip: str,
    nexus_state: str,
    nexus_city: str,
    nexus_street: str,
    subtotal: Decimal,
    shipping_cost: Decimal,
    to_state: str,
    to_zip: str,
    to_country: str,
    to_city: str,
    to_street: str,
) -> tuple[Decimal, Decimal, str]:
    url = f"{str(api_base).rstrip('/')}/v2/taxes"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "from_country": nexus_country,
        "from_zip": nexus_zip,
        "from_state": nexus_state,
        "from_city": nexus_city,
        "from_street": nexus_street,
        "to_country": to_country,
        "to_zip": to_zip,
        "to_state": to_state,
        "amount": float(subtotal),
        "shipping": float(shipping_cost),
    }
    if to_city:
        body["to_city"] = str(to_city).strip()
    if to_street:
        body["to_street"] = str(to_street).strip()

    response = requests.post(url, json=body, headers=headers, timeout=12)
    # import pdb;pdb.set_trace()
    response.raise_for_status()
    payload = response.json().get("tax", {})

    amount_to_collect = Decimal(str(payload.get("amount_to_collect", "0")))
    rate = Decimal(str(payload.get("rate", "0")))
    county = str(payload.get("jurisdictions", {}).get("county", "") or "").strip()

    return _quantize_money(amount_to_collect), rate, county




















