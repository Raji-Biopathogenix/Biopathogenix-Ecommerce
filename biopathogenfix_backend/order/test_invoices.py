from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.http import Http404
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from order.invoice_views import OrderInvoiceView, invoice_summary
from payments.utils import _build_invoice_line_items, create_qb_invoice


class InvoiceTests(SimpleTestCase):
    def setUp(self):
        self.order = SimpleNamespace(
            id=90, qb_invoice_id="123", qb_realm_id="456", qb_customer_id="789",
            paymet_status="pending", status="pending",
        )
        self.invoice = {
            "Id": "123", "CustomerRef": {"value": "789"}, "DocNumber": "7858",
            "Balance": 36.20, "TotalAmt": 286.20, "DueDate": "2020-01-01",
            "InvoiceLink": "https://connect.intuit.com/portal/invoice/test",
        }

    def request(self, suffix=""):
        req = APIRequestFactory().get("/orders/90/invoice/" + suffix)
        self.user = SimpleNamespace(is_authenticated=True, pk=999999)
        force_authenticate(req, user=self.user)
        return req

    def test_balance_statuses_and_payment_sync(self):
        result = invoice_summary(self.invoice, self.order)
        self.assertEqual(result["status"], "partially_paid")
        self.assertTrue(result["overdue"])
        self.assertIsNotNone(result["payment_url"])
        self.invoice["Balance"] = 286.20
        self.assertEqual(invoice_summary(self.invoice, self.order)["status"], "unpaid")
        self.order.paymet_status = "success"
        result = invoice_summary(self.invoice, self.order)
        self.assertTrue(result["payment_sync_pending"])
        self.assertIsNone(result["payment_url"])
        self.invoice["Balance"] = 0
        self.assertEqual(invoice_summary(self.invoice, self.order)["status"], "paid")

    def test_no_payment_link_for_cancelled_order_or_untrusted_host(self):
        self.order.status = "cancelled"
        self.assertIsNone(invoice_summary(self.invoice, self.order)["payment_url"])
        self.order.status = "pending"
        for url in ("javascript:alert(1)", "https://intuit.com.evil.test/pay", "http://intuit.com/pay"):
            self.invoice["InvoiceLink"] = url
            self.assertIsNone(invoice_summary(self.invoice, self.order)["payment_url"])

    @patch("order.invoice_views.requests.get")
    @patch("order.invoice_views.get_object_or_404")
    def test_ownership_filter_and_missing_order(self, lookup, get):
        lookup.side_effect = Http404
        response = OrderInvoiceView(self.request(), order_id=90)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(lookup.call_args.kwargs, {"id": 90, "user": self.user})
        get.assert_not_called()

    def test_unauthenticated_request_denied(self):
        response = OrderInvoiceView(APIRequestFactory().get("/orders/90/invoice/"), order_id=90)
        self.assertIn(response.status_code, (401, 403))

    @patch("order.invoice_views.requests.get")
    @patch("order.invoice_views.get_object_or_404")
    def test_old_orders_do_not_guess_invoice(self, lookup, get):
        self.order.qb_invoice_id = ""
        lookup.return_value = self.order
        response = OrderInvoiceView(self.request(), order_id=90)
        self.assertFalse(response.data["available"])
        get.assert_not_called()

    @patch("order.invoice_views.get_valid_qb_token", return_value="test")
    @patch("order.invoice_views.QBConfig.get")
    @patch("order.invoice_views.requests.get")
    @patch("order.invoice_views.get_object_or_404")
    def test_live_invoice_pdf_and_customer_check(self, lookup, get, config, token):
        lookup.return_value = self.order
        config.return_value = SimpleNamespace(realm_id="456", environment="sandbox")
        get.return_value = Mock(json=lambda: {"Invoice": self.invoice})
        response = OrderInvoiceView(self.request(), order_id=90)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["number"], "7858")
        self.assertEqual(response["Cache-Control"], "private, no-store")
        self.invoice["CustomerRef"]["value"] = "another-customer"
        response = OrderInvoiceView(self.request("?download=pdf"), order_id=90)
        self.assertEqual(response.status_code, 503)
        self.invoice["CustomerRef"]["value"] = "789"
        get.side_effect = [Mock(json=lambda: {"Invoice": self.invoice}), Mock(content=b"%PDF-1.7 test")]
        response = OrderInvoiceView(self.request("?download=pdf"), order_id=90)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF-"))

    @patch("order.invoice_views.get_valid_qb_token")
    @patch("order.invoice_views.QBConfig.get")
    @patch("order.invoice_views.get_object_or_404")
    def test_company_switch_blocks_invoice_access(self, lookup, config, token):
        lookup.return_value = self.order
        config.return_value = SimpleNamespace(realm_id="different")
        response = OrderInvoiceView(self.request(), order_id=90)
        self.assertEqual(response.status_code, 503)
        token.assert_not_called()

    @patch("payments.utils.get_qb_item_by_sku", return_value="product-id")
    def test_shipping_uses_native_summary_item(self, lookup):
        item = SimpleNamespace(unit_price=Decimal("250"), quantity=1, sku_code="kit",
                               product=SimpleNamespace(name="Extraction kit"))
        for shipping in (Decimal("20"), Decimal("0")):
            lines = _build_invoice_line_items("token", "realm", "url",
                                             SimpleNamespace(shipping_cost=shipping), [item], "default")
            shipping_lines = [line for line in lines if line.get("SalesItemLineDetail", {}).get("ItemRef", {}).get("value") == "SHIPPING_ITEM_ID"]
            self.assertEqual(len(shipping_lines), 1 if shipping else 0)
            if shipping:
                self.assertEqual(lines[-2]["DetailType"], "SubTotalLineDetail")
                self.assertEqual(lines[-2]["Amount"], 250)
                self.assertEqual(lines[-1]["Amount"], 20)

    @patch("payments.utils._record_qb_payment", side_effect=RuntimeError("payment sync failed"))
    @patch("payments.utils.requests.post")
    @patch("payments.utils._build_invoice_line_items", return_value=[])
    @patch("payments.utils.get_or_create_qb_item", return_value="item")
    @patch("payments.utils.is_qb_customer_active", return_value=True)
    @patch("payments.utils.QBConfig.get")
    def test_invoice_link_saved_before_payment_recording(self, config, customer, item, lines, post, payment):
        config.return_value = SimpleNamespace(realm_id="456", environment="sandbox")
        order = Mock(id=90, amount=286.20, customer_notes="", transaction_id="test")
        post.return_value = Mock(status_code=200, text="{}", json=lambda: {"Invoice": self.invoice})
        with self.assertRaises(RuntimeError):
            create_qb_invoice("test", order, [], "card", SimpleNamespace(quickbook_customer_id="789"))
        self.assertEqual(order.qb_invoice_id, "123")
        self.assertEqual(order.qb_customer_id, "789")
        order.save.assert_called_once_with(update_fields=["qb_invoice_id", "qb_realm_id", "qb_customer_id"])
