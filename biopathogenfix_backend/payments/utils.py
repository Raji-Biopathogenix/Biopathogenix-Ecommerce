import uuid
import base64
import logging
import requests
from datetime import datetime, timedelta
from django.conf import settings
from django.core.mail import send_mail
from .models import QBConfig
from config.settings import configSettings

logger = logging.getLogger(__name__)

#  AVS response codes → action ------------------------
AVS_ACCEPT_CODES = {
    "Y",   # Street + ZIP match  best case
    "Z",   # ZIP matches, street not verified  acceptable
    "P",   # ZIP matches (international)
    "D",   # Street + ZIP match (international)
    "M",   # Street + ZIP match (international)
}

AVS_REJECT_CODES = {
    "N",   # Neither street nor ZIP match 
    "A",   # Street matches but ZIP doesn't risky
    "C",   # Street + ZIP not verified 
}

AVS_MESSAGES = {
    "N": "Billing address does not match. Please check your billing ZIP code and street address.",
    "A": "Billing ZIP code does not match your card records. Please check and try again.",
    "C": "We could not verify your billing address. Please check and try again.",
}

# ------------------------------------------- Payments for QBBooks ------------------------

#  In-memory token cache (avoids DB hit on every request)
_token_cache = {
    "access_token": None,
    "expires_at":   None,
}

# QB API error code → friendly message
QB_DECLINE_MESSAGES = {
    "PMT-4000": "Your card was declined. Please contact your bank.",
    "PMT-4001": "Insufficient funds. Please use a different card.",
    "PMT-4002": "Your card has expired. Please use a different card.",
    "PMT-4003": "Invalid card number. Please check and try again.",
    "PMT-4004": "This card type is not supported.",
    "PMT-4100": "Transaction limit exceeded. Please contact your bank.",
}


def get_basic_auth() -> str:
    """Base64 encode client_id:client_secret for QB token endpoint."""
    credentials = f"{configSettings.QB_CLIENT_ID}:{configSettings.QB_CLIENT_SECRET}"
    return base64.b64encode(credentials.encode()).decode()

def get_qb_base_url(config: QBConfig) -> str:
    """Returns QB Payments API base URL (charges, tokens, refunds)."""
    if config.environment == "production":
        return "https://api.intuit.com"
    return "https://sandbox.api.intuit.com"

def get_qb_accounting_base_url(config: QBConfig) -> str:
    """Returns QB Accounting API base URL (invoices, customers, payments)."""
    if config.environment == "production":
        return "https://quickbooks.api.intuit.com"
    return "https://sandbox-quickbooks.api.intuit.com"

    


def get_valid_qb_token() -> str:
    """
    Returns a valid QB access token for Biopathogenix's QB account.
    Flow:
    1. Check in-memory cache first (avoids unnecessary DB + API calls)
    2. If expired → refresh using refresh_token stored in QBConfig DB table
    3. Save new tokens back to QBConfig (QB rotates refresh token too)
    4. Return fresh access_token

    No user parameter — this is YOUR platform's single QB account.
    End users have ZERO involvement in this.
    """

    now = datetime.utcnow()

    #  1 . Return cached token if still valid (5 min buffer) 
    if (_token_cache["access_token"] and _token_cache["expires_at"] and 
        now < _token_cache["expires_at"] - timedelta(minutes=5)):
        logger.debug("QB token served from cache")
        return _token_cache["access_token"]

    # 2. Load refresh token from DB 
    config = QBConfig.get()

    # Warn admin if refresh token is getting old 
    days_since_update = (datetime.utcnow() - config.updated_at.replace(tzinfo=None)).days

    if days_since_update >= 80:   # warn at 80 days (20 day buffer before 100)
        logger.warning(
            f"QB refresh token is {days_since_update} days old — "
            f"will expire in ~{100 - days_since_update} days. "
            f"If no payments are processed, admin must re-authorize."
        )
        # Also email admin
        send_mail(subject=" QuickBooks Token Expiring Soon",
            message=(
                f"QB refresh token is {days_since_update} days old.\n"
                f"It will expire in ~{100 - days_since_update} days if unused.\n\n"
                f"If your store is active, this will auto-renew.\n"
                f"If not, go to /admin/payments/qbconfig/ to update tokens."
            ),
            from_email=configSettings.DEFAULT_FROM_EMAIL,
            recipient_list=[configSettings.ADMIN_ALERT_EMAIL],
            fail_silently=True,
        )

    # 3. Call QB token refresh endpoint 
    try:
        #  "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",  ===> Live and sanbox  api
        response = requests.post(
            "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
            headers={
                "Content-Type":  "application/x-www-form-urlencoded",
                "Authorization": f"Basic {get_basic_auth()}",
            },
            data={
                "grant_type":    "refresh_token",
                "refresh_token": config.refresh_token,
            },
            timeout=15,
        )

        if response.status_code == 401:
            # Refresh token itself has expired (every 100 days)
            # You need to re-authorize from Django Admin
            logger.critical("QB refresh token EXPIRED. Manual re-authorization required.")
            raise Exception(
                "QB_REFRESH_EXPIRED: QuickBooks authorization has expired. "
                "Admin must re-authorize via /admin/payments/qbconfig/."
            )

        if response.status_code != 200:
            raise Exception(f"QB token refresh HTTP {response.status_code}: {response.text}")

        token_data = response.json()

        # 4. Save rotated tokens back to DB 
        config.access_token  = token_data["access_token"]
        config.refresh_token = token_data.get("refresh_token", config.refresh_token)
        config.save(update_fields=["access_token", "refresh_token", "updated_at"])

        #  5. Update in-memory cache 
        expires_in = token_data.get("expires_in", 3600)
        _token_cache["access_token"] = token_data["access_token"]
        _token_cache["expires_at"]   = now + timedelta(seconds=expires_in)

        logger.info("QB access token refreshed and saved to DB")
        return _token_cache["access_token"]

    except Exception as e:
        if "QB_REFRESH_EXPIRED" in str(e):
            raise  # Re-raise as-is
        logger.error(f"QB token refresh error: {e}")
        raise Exception("Payment service temporarily unavailable. Please try again shortly.")


def tokenize_card(access_token: str, card_data: dict) -> str:  #Not in Use
    """
    Send raw card data to QB Tokens API → returns a one-time-use token.
    Token is used immediately to charge the card.

    QB Tokens API is PCI-DSS compliant — card data is never stored anywhere.
    """
    config   = QBConfig.get()
    base_url = get_qb_base_url(config)

    response = requests.post(
        f"{base_url}/quickbooks/v4/payments/tokens",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type":  "application/json",
            "Request-Id":    str(uuid.uuid4()),
        },
        json={
            "card": {
                "name":     card_data.get("card_name", ""),
                "number":   card_data.get("card_number", "").replace(" ", ""),
                "expMonth": card_data.get("card_exp_month", ""),
                "expYear":  card_data.get("card_exp_year", ""),
                "cvc":      card_data.get("card_cvv", ""),
            }
        },
        timeout=15,
    )

    result = response.json()

    # QB returns "value" field for the token
    token = result.get("value")
    if not token:
        errors = result.get("errors", [{}])
        error_msg = errors[0].get("message", "Card tokenization failed.") if errors else "Card tokenization failed."
        logger.warning(f"QB tokenization failed: {result}")
        raise ValueError(error_msg)

    return token


def charge_card(access_token: str,card_data: dict , amount: float, idempotency_key: str,billing_address: dict) -> dict:
    """
    Charge the card using the QB token.
    Returns the full QB charge response dict.
    Raises ValueError for declined cards.
    Raises ConnectionError for gateway issues.
    """
    # "Request-Id":    idempotency_key,  # QB uses this for idempotency
    # "postalCode": "94086",
    # "country": "US",
    # "region": "CA",
    # "streetAddress": "1130 Kifer Rd",
    # "city": "Sunnyvale"

    config   = QBConfig.get()
    base_url = get_qb_base_url(config)

    try:
        response = requests.post(
        f"{base_url}/quickbooks/v4/payments/charges",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type":"application/json",
            "Accept":"application/json",
            "Request-Id":str(uuid.uuid4()),
        },
        json={
            "amount":   f"{float(amount):.2f}",
            "currency": "USD",
            "context":  {"mobile": "false", "isEcommerce": "true"},  # ← strings not bools
            "card": {
                "name":     card_data.get("card_name", ""),
                "number":   card_data.get("card_number", "").replace(" ", ""),
                "expMonth": card_data.get("card_exp_month", ""),
                "expYear":  card_data.get("card_exp_year", ""),
                "cvc":      card_data.get("card_cvv", ""),
                "address": {
                    "postalCode": billing_address.get("postal_code", ""),
                    "country": "US", 
                    "region": billing_address.get("state_code", ""), 
                    "streetAddress": billing_address.get("line1", ""),
                    "city":billing_address.get("city",  ""),

                    # "postalCode": "94086", 
                    # "country": "US", 
                    # "region": "CA", 
                    # "streetAddress": "1130 Kifer Rd", 
                    # "city": "Sunnyvale"
                }
            },
        },
        timeout=30,
        )
        # Gateway errors (5xx) 
        if response.status_code in [500, 502, 503, 504]:
            raise ConnectionError("QB payment gateway unavailable. Please try again shortly.")

        result = response.json()
        status = result.get("status")

        #  Card declined 
        if status == "DECLINED":
            errors       = result.get("errors", [{}])
            decline_code = errors[0].get("code", "") if errors else ""
            message      = QB_DECLINE_MESSAGES.get(
                decline_code,
                "Payment declined. Please try a different card."
            )
            raise ValueError(message)

        #  Invalid token 
        if status == "INVALID" or response.status_code == 400:
            raise ValueError("Payment session expired. Please refresh and try again.")

        #  Unexpected status 
        if status != "CAPTURED":
            logger.error(f"Unexpected QB charge status: {result}")
            raise ValueError("Payment could not be processed. Please try again.")


        # import pdb;pdb.set_trace();
        # {"id":"MT5284741718","created":"2026-02-23T15:17:13Z","status":"CAPTURED","amount":"80.00","currency":"USD","card":{"number":"xxxxxxxxxxxx1111","expMonth":"04","expYear":"2029","cvc":"xxx","name":"Raji Gopu","address":{"streetAddress":"1130 Kifer Rd","city":"Sunnyvale","region":"CA","country":"US","postalCode":"94086"},"cardType":"Visa"},"context":{"mobile":false,"isEcommerce":true,"recurring":false,"deviceInfo":{},"clientTransID":"a00019xuyrjr"},"authCode":"tst940","appType":"3393479912556605372","avsStreet":"Pass","avsZip":"Pass","cardSecurityCodeMatch":"NotAvailable"}


        # AVS Check 
        avs_code = result.get("card", {}).get("avsStreet") or result.get("avsDetail", {}).get("avsStreet", "")

        logger.info(f"AVS code received: {avs_code}")

        if avs_code in AVS_REJECT_CODES:
            # Card was charged but AVS failed
            # Must void the charge immediately
            charge_id = result.get("id")
            _void_charge(access_token, charge_id)
            message = AVS_MESSAGES.get(avs_code, "Billing address verification failed.")
            logger.warning(f"AVS rejected | code={avs_code} | charge {charge_id} voided")
            raise ValueError(message)

        if avs_code and avs_code not in AVS_ACCEPT_CODES:
            # Unknown AVS code — log it but accept (don't block payment)
            logger.warning(f"Unknown AVS code: {avs_code} — accepting payment")

        return result

    except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
        raise ConnectionError("Payment gateway timeout. Please try again shortly.")



def _void_charge(access_token: str, charge_id: str) -> None:
    """
    Voids a captured charge when AVS fails.
    This returns money to the customer immediately.
    """
    try:
        config   = QBConfig.get()
        base_url = get_qb_base_url(config)
        response = requests.post(
            f"{base_url}/quickbooks/v4/payments/charges/{charge_id}/void",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type":  "application/json",
                "Request-Id":    str(uuid.uuid4()),
            },
            timeout=15,
        )
        if response.status_code == 200:
            logger.info(f"Charge {charge_id} voided due to AVS failure")
        else:
            # Void failed — critical, charge exists but can't void
            logger.critical(
                f"VOID FAILED for charge {charge_id} after AVS rejection | "
                f"response: {response.text} | "
                f"ACTION: Manually void/refund this charge in QB immediately"
            )
    except Exception as e:
        logger.critical(f"VOID FAILED for charge {charge_id}: {e} — manual refund required")



def notify_admin_critical(transaction_id: str, user_id: int, email: str, amount: float, error: str):
    """Alert admin when payment captured but order creation failed."""
    try:
        send_mail(
            subject=" CRITICAL: Payment captured but order creation FAILED",
            message=(
                f"Transaction ID : {transaction_id}\n"
                f"User ID        : {user_id}\n"
                f"User Email     : {email}\n"
                f"Amount         : ${amount}\n"
                f"Error          : {error}\n\n"
                "ACTION REQUIRED: Manually create order or issue refund immediately.\n"
                f"QB Charge ID: {transaction_id}"
            ),
            from_email=configSettings.DEFAULT_FROM_EMAIL,
            recipient_list=[configSettings.ADMIN_ALERT_EMAIL],
            fail_silently=True,
        )
    except Exception as e:
        logger.error(f"Failed to send admin alert email: {e}")






# ------------------------------------------- Invoice for QBBooks ------------------------




def get_or_create_qb_customer(access_token: str, realm_id: str, base_url: str, order) -> str:
    """
    Finds existing QB customer by email or creates a new one.
    Returns QB customer Id string.
    """
    email = order.shipping_email

    # Search for existing customer by email 
    try:
        search_response = requests.get(
            f"{base_url}/v3/company/{realm_id}/query",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept":        "application/json",
            },
            params={
                "query": f"SELECT * FROM Customer WHERE PrimaryEmailAddr = '{email}'"
            },
            timeout=15,
        )
        customers = search_response.json().get("QueryResponse", {}).get("Customer", [])
        if customers:
            print(f"QB Customer found: {customers[0]['Id']} for {email} (Active={customers[0].get('Active')})")
            return customers[0]["Id"]
    except Exception as e:
        logger.warning(f"QB customer search failed, will create new: {e}")

    # Create new QB customer 
    create_response = requests.post(
        f"{base_url}/v3/company/{realm_id}/customer",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type":  "application/json",
            "Accept":        "application/json",
        },
        json={
            "GivenName":        order.shipping_first_name,
            "FamilyName":       order.shipping_last_name,
            "DisplayName":      f"{order.shipping_first_name} {order.shipping_last_name} ({email})",
            "PrimaryEmailAddr": { "Address": email },
            "PrimaryPhone":     { "FreeFormNumber": order.shipping_phone or "" },
            "BillAddr": {
                "Line1":                  order.billing_address_line1,
                "City":                   order.billing_city,
                "CountrySubDivisionCode": order.billing_state,
                "PostalCode":             order.billing_postal_code,
                "Country":                "US",
            },
        },
        timeout=15,
    )

    customer = create_response.json().get("Customer", {})
    customer_id = customer.get("Id")

    if not customer_id:
        logger.error(f"QB Customer creation failed: {create_response.json()}")
        raise Exception("Failed to create QB customer.")

    print(f"QB Customer created: {customer_id} for {email}")
    return customer_id






def get_or_create_qb_item(access_token: str, realm_id: str, base_url: str) -> str:
    """
    Finds an active, sellable Product/Service Item in QB to use as the
    line ItemRef. QuickBooks requires every SalesItemLineDetail line to
    reference an Item that exists in the company — without one, invoice
    creation fails with a generic "Object Not Found / inactive" fault.

    "Category" and "Group" type items are excluded — they look active
    but cannot be used as a direct line ItemRef.
    """
    response = requests.get(
        f"{base_url}/v3/company/{realm_id}/query",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept":        "application/json",
        },
        params={"query": "SELECT * FROM Item WHERE Active = true MAXRESULTS 20"},
        timeout=15,
    )
    raw = response.json()
    items = raw.get("QueryResponse", {}).get("Item", [])
    print(f"QB Item query raw response: {raw}")
    print(f"QB Items found ({len(items)}): " + str([(i.get('Id'), i.get('Name'), i.get('Type')) for i in items]))

    sellable = [i for i in items if i.get("Type") not in ("Category", "Group")]

    if not sellable:
        print(f"QB Item query returned no sellable items out of {len(items)} total")
        raise Exception(
            "No active, sellable Product/Service Item found in QuickBooks. "
            "Create at least one Item (Sales -> Products and Services) before invoicing."
        )

    chosen = sellable[0]
    print(
        f"QB Item selected for invoice lines: {chosen.get('Id')} "
        f"({chosen.get('Name')}, type={chosen.get('Type')})"
    )
    return chosen["Id"]


def _build_invoice_line_items(order, orderItems: list, item_id: str) -> list:
    """
    Builds QB invoice line items from order items.
    Includes products, shipping, and tax as separate lines.
    """
    line_items = []

    #  Product lines
    for i, item in enumerate(orderItems, start=1):
        line_amount = float(item.unit_price) * int(item.quantity)
        line_items.append({
            "Id":          str(i),
            "LineNum":     i,
            "Amount":      line_amount,
            "Description": "Product ID : #{product_id} \n Product Name:{product_name} \n Order ID: #{order_id}".format(product_id= item.product.id,product_name=item.product.name,order_id=item.id),
            "DetailType":  "SalesItemLineDetail",
            "SalesItemLineDetail": {
                "Qty":       int(item.quantity),
                "UnitPrice": float(item.unit_price),
                "ItemRef":   { "value": item_id },
            },
        })

    #  Shipping line
    if float(order.shipping_cost) > 0:
        line_items.append({
            "LineNum":     len(line_items) + 1,
            "Amount":      float(order.shipping_cost),
            "Description": "Shipping",
            "DetailType":  "SalesItemLineDetail",
            "SalesItemLineDetail": {
                "Qty":       1,
                "UnitPrice": float(order.shipping_cost),
                "ItemRef":   { "value": item_id },
            },
        })

    #  Tax line
    if float(order.tax_amount) > 0:
        line_items.append({
            "LineNum":     len(line_items) + 1,
            "Amount":      float(order.tax_amount),
            "Description": f"Tax ({float(order.tax_rate) * 100:.2f}%)",
            "DetailType":  "SalesItemLineDetail",
            "SalesItemLineDetail": {
                "Qty":       1,
                "UnitPrice": float(order.tax_amount),
                "ItemRef":   { "value": item_id },
            },
        })


    return line_items




def _record_qb_payment(
    access_token:   str,
    realm_id:       str,
    base_url:       str,
    customer_id:    str,
    invoice_id:     str,
    amount:         float,
    transaction_id: str,
) -> None:
    """
    Records payment against a QB invoice → marks invoice as PAID.
    Only called for card payments where money is already captured.
    """
    payment_response = requests.post(
        f"{base_url}/v3/company/{realm_id}/payment",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type":  "application/json",
            "Accept":        "application/json",
        },
        json={
            "TotalAmt":    amount,
            "CustomerRef": { "value": customer_id },
            "PrivateNote": f"QB Payments Transaction ID: {transaction_id}",
            "Line": [
                {
                    "Amount":    amount,
                    "LinkedTxn": [
                        {
                            "TxnId":   invoice_id,
                            "TxnType": "Invoice",
                        }
                    ],
                }
            ],
        },
        timeout=15,
    )

    result = payment_response.json()
    if "Payment" in result:
        logger.info(
            f"QB Invoice #{invoice_id} marked PAID | "
            f"Payment ID: {result['Payment']['Id']} | txn={transaction_id}"
        )
    else:
        # Payment recording failed — invoice exists but shows unpaid
        # Not critical enough to fail the order, but log it
        logger.error(
            f"QB Payment recording failed for invoice #{invoice_id} | "
            f"response: {result}"
        )




def create_qb_invoice(access_token: str, order, orderItems: list, payment_method: str,user) -> dict:
    """
    Creates a QB invoice for every order automatically.

    Card payment    → Invoice created + marked PAID immediately 
    Invoice payment → Invoice created + emailed to customer (unpaid) 

    Args:
        access_token:   Valid QB OAuth access token
        order:          Saved Order model instance
        cart_items:     List of cart items with name, product_id, qty, price
        payment_method: "card" or "invoice"

    Returns:
        QB Invoice dict
    """
    config   = QBConfig.get()
    base_url = get_qb_accounting_base_url(config)
    realm_id = config.realm_id



    # Step 1: Get or create QB customer
    if not user.quickbook_customer_id:
        customer_id = get_or_create_qb_customer(access_token, realm_id, base_url, order)
        user.quickbook_customer_id = customer_id
        user.save(update_fields=["quickbook_customer_id"])
    else:
        customer_id = user.quickbook_customer_id

    print(f"QB invoice for Order #{order.id} using customer_id={customer_id} realm_id={realm_id}")

    # Step 2: Build line items
    item_id = get_or_create_qb_item(access_token, realm_id, base_url)
    line_items = _build_invoice_line_items(order, orderItems, item_id)

    # Step 3: Build invoice payload 
    invoice_payload = {
        "Line":        line_items,
        "CustomerRef": { "value": customer_id },
        "DocNumber":   f"ORD-{order.id:06d}",

        "CustomerMemo": {
            "value": order.customer_notes or "Thank you for your order!"
        },

        # Billing address
        "BillAddr": {
            "Line1":                  order.billing_address_line1,
            "City":                   order.billing_city,
            "CountrySubDivisionCode": order.billing_state_code,
            "PostalCode":             order.billing_postal_code,
            "Country":                "US",
        },

        # Shipping address
        "ShipAddr": {
            "Line1":                  order.shipping_address_line1,
            "City":                   order.shipping_city,
            "CountrySubDivisionCode": order.shipping_state_code,
            "PostalCode":             order.shipping_postal_code,
            "Country":                "US",
        },

        # Email invoice for invoice payments only
        "BillEmail":   { "Address": order.shipping_email },
        "EmailStatus": "NeedToSend" if payment_method == "invoice" else "NotSet",
    }

    #  Step 4: Create invoice in QB
    print(f"QB invoice payload for Order #{order.id}: {invoice_payload}")
    invoice_response = requests.post(
        f"{base_url}/v3/company/{realm_id}/invoice",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type":  "application/json",
            "Accept":        "application/json",
        },
        json=invoice_payload,
        timeout=15,
    )

    if not invoice_response.text or not invoice_response.text.strip():
        logger.error(
            f"QB Invoice API returned empty body | Order #{order.id} | "
            f"status={invoice_response.status_code} | headers={dict(invoice_response.headers)}"
        )
        raise Exception(f"QB Invoice API returned empty response (status {invoice_response.status_code})")

    try:
        invoice_data = invoice_response.json()
    except Exception:
        logger.error(
            f"QB Invoice API returned non-JSON | Order #{order.id} | "
            f"status={invoice_response.status_code} | body={invoice_response.text[:500]}"
        )
        raise Exception(f"QB Invoice API returned non-JSON (status {invoice_response.status_code}): {invoice_response.text[:200]}")

    if invoice_response.status_code >= 400 or "Fault" in invoice_data:
        logger.error(
            f"QB Invoice API error | Order #{order.id} | "
            f"status={invoice_response.status_code} | response={invoice_data}"
        )
        raise Exception(f"QB Invoice API error (status {invoice_response.status_code}): {invoice_data}")

    invoice      = invoice_data.get("Invoice", {})
    invoice_id   = invoice.get("Id")

    if not invoice_id:
        logger.error(f"QB Invoice creation failed for Order #{order.id}: {invoice_data}")
        raise Exception(f"QB Invoice creation failed: {invoice_data}")

    logger.info(
        f"QB Invoice #{invoice_id} created | "
        f"Order #{order.id} | method={payment_method} | amount={order.amount}"
    )

    #  Step 5: Mark as PAID for card payments 
    if payment_method == "card":
        _record_qb_payment(
            access_token   = access_token,
            realm_id       = realm_id,
            base_url       = base_url,
            customer_id    = customer_id,
            invoice_id     = invoice_id,
            amount         = float(order.amount),
            transaction_id = order.transaction_id,
        )

    return invoice

def refund_qb_charge(
    access_token:   str,
    charge_id:    str,
    amount:       float,
    description:  str = '',
) -> dict:
    """
    Refund a QuickBooks Payments charge (full or partial).
    Uses POST /quickbooks/v4/payments/charges/{id}/refunds

    Args:
        charge_id:   The charge ID from original CREATE charge response
        amount:      Refund amount (0.01 to 99999.99)
        description: Optional description

    Returns:
        QB refund response dict
    """
    config   = QBConfig.get()
    base_url = get_qb_base_url(config)
    realm_id = config.realm_id


    url = (
        f"{base_url}/quickbooks/v4/payments/charges/{charge_id}/refunds"
    )

    headers = {
        "Authorization":  f"Bearer {access_token}",
        "Content-Type":   "application/json",
        "Accept":         "application/json",
        # Required — must be unique per request
        "request-Id":     str(uuid.uuid4()),
        "Company-Id":     realm_id,
    }

    payload = {
        "amount":      f"{amount:.2f}",   # e.g. "247.50"
        "description": description or f"Refund",
        "context": {
            "mobile":      False,
            "isEcommerce": True,
        },
    }



    response = requests.post(url, json=payload, headers=headers)

    if not response.ok:
        raise Exception(
            f"QB Payments refund error {response.status_code}: {response.text}"
        )

    return response.json()
