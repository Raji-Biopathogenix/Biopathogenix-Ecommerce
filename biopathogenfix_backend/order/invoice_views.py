"""Customer access to the invoice attached to their own order."""
import logging
from datetime import date
from decimal import Decimal
from urllib.parse import quote, urlsplit

import requests
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from payments.models import QBConfig
from payments.utils import get_valid_qb_token, get_qb_accounting_base_url
from .models import Order

logger = logging.getLogger(__name__)


def invoice_summary(invoice, order):
    balance = Decimal(str(invoice["Balance"]))
    total = Decimal(str(invoice["TotalAmt"]))
    due_date = invoice.get("DueDate")
    voided = str(invoice.get("PrivateNote", "")).startswith("Voided") and total == 0
    if voided:
        payment_status = "voided"
    elif balance <= 0:
        payment_status = "paid"
    elif balance < total:
        payment_status = "partially_paid"
    else:
        payment_status = "unpaid"
    overdue = balance > 0 and bool(due_date and date.fromisoformat(due_date) < date.today())
    # Never ask a card customer to pay twice if QB payment recording failed.
    payment_sync_pending = order.paymet_status == "success" and balance > 0
    link = invoice.get("InvoiceLink")
    if link:
        url = urlsplit(link)
        host = (url.hostname or "").lower()
        if url.scheme != "https" or not (host == "intuit.com" or host.endswith(".intuit.com")):
            link = None
    return {
        "available": True,
        "number": invoice.get("DocNumber") or invoice["Id"],
        "status": payment_status,
        "overdue": overdue,
        "total": str(total),
        "balance": str(balance),
        "currency": invoice.get("CurrencyRef", {}).get("value", "USD"),
        "due_date": due_date,
        "payment_sync_pending": payment_sync_pending,
        "payment_url": link if balance > 0 and not payment_sync_pending and order.status not in (
            "cancelled", "refunded", "partially_refunded"
        ) else None,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def OrderInvoiceView(request, order_id):
    order = get_object_or_404(Order, id=order_id, user=request.user)
    if not order.qb_invoice_id or not order.qb_realm_id or not order.qb_customer_id:
        return Response({"available": False, "message": "Invoice unavailable. Please contact our billing team."})
    try:
        config = QBConfig.get()
        if str(config.realm_id) != order.qb_realm_id:
            raise ValueError("Invoice belongs to a different QuickBooks company")
        token = get_valid_qb_token()
        url = (
            f"{get_qb_accounting_base_url(config)}/v3/company/{quote(order.qb_realm_id, safe='')}"
            f"/invoice/{quote(order.qb_invoice_id, safe='')}"
        )
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
        response = requests.get(url, headers=headers, params={"include": "invoiceLink"}, timeout=15)
        response.raise_for_status()
        invoice = response.json()["Invoice"]
        if (str(invoice.get("Id")) != order.qb_invoice_id or
                str(invoice.get("CustomerRef", {}).get("value")) != order.qb_customer_id):
            raise ValueError("Invoice identity does not match the order")
        if request.query_params.get("download") == "pdf":
            pdf = requests.get(url + "/pdf", headers={**headers, "Accept": "application/pdf"}, timeout=20)
            pdf.raise_for_status()
            if not pdf.content.startswith(b"%PDF-"):
                raise ValueError("QuickBooks did not return a PDF")
            result = HttpResponse(pdf.content, content_type="application/pdf")
            result["Content-Disposition"] = f'inline; filename="invoice-order-{order.id}.pdf"'
        else:
            result = Response(invoice_summary(invoice, order))
        result["Cache-Control"] = "private, no-store"
        return result
    except (requests.RequestException, ValueError, KeyError, TypeError):
        logger.warning("Unable to retrieve QuickBooks invoice for order %s", order.id)
    except Exception:
        # Token/configuration failures must not expose credentials to customers.
        logger.warning("QuickBooks unavailable for order %s", order.id)
    return Response({"message": "Unable to load your invoice right now. Please try again."}, status=503)
