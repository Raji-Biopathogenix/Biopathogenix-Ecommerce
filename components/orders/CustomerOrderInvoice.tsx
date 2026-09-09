"use client";

import { useEffect, useRef, useState } from "react";
import { OrderServices } from "@/services/orderServices";
import { OrderSummary, QuickBooksInvoice } from "@/types/order";

const labels = { paid: "Paid", unpaid: "Payment due", partially_paid: "Partially paid", voided: "Voided" };

export default function CustomerOrderInvoice({ order }: { order: OrderSummary }) {
  const [open, setOpen] = useState(false);
  const [invoice, setInvoice] = useState<QuickBooksInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const currentPdfUrl = useRef("");
  useEffect(() => () => {
    if (currentPdfUrl.current) URL.revokeObjectURL(currentPdfUrl.current);
  }, []);

  const money = (value: string | number | undefined, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value ?? 0));

  async function loadInvoice() {
    setOpen(true);
    setLoading(true);
    setError("");
    setInvoice(null);
    setPdfUrl("");
    if (currentPdfUrl.current) URL.revokeObjectURL(currentPdfUrl.current);
    currentPdfUrl.current = "";
    try {
      setInvoice(await OrderServices.fetchInvoice(order.id));
    } catch {
      setError("Unable to load your invoice right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPdf() {
    setPdfBusy(true);
    setError("");
    try {
      const blob = await OrderServices.fetchInvoicePdf(order.id);
      const url = URL.createObjectURL(blob);
      currentPdfUrl.current = url;
      setPdfUrl(url);
    } catch {
      setError("Unable to load the invoice PDF. Please try again.");
    } finally {
      setPdfBusy(false);
    }
  }

  const invoiceLabel = invoice?.payment_sync_pending ? "Payment received · Invoice updating"
    : invoice?.status ? labels[invoice.status] : "";
  const buttonClass = "rounded-lg border border-[#c8dcea] px-3 py-2 text-xs font-semibold text-[#0b2e59] hover:bg-[#eef5fb] disabled:opacity-50";

  return (
    <section className="border-b border-[#e6eef5] px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#0b2e59]">Order summary</h3>
        <button type="button" className={buttonClass} disabled={loading || pdfBusy}
          aria-expanded={open} aria-controls={`invoice-${order.id}`}
          onClick={() => open ? setOpen(false) : loadInvoice()}>
          {loading ? "Loading invoice…" : open ? "Hide invoice" : "View invoice"}
        </button>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        <div><dt className="text-gray-500">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
        {Number(order.coupon_amt) > 0 && <div><dt className="text-gray-500">Discount</dt><dd>−{money(order.coupon_amt)}</dd></div>}
        <div><dt className="text-gray-500">Shipping</dt><dd>{money(order.shipping_cost)}</dd></div>
        <div><dt className="text-gray-500">Tax</dt><dd>{money(order.tax_amount)}</dd></div>
        <div><dt className="text-gray-500">Total</dt><dd className="font-semibold text-[#0b2e59]">{money(order.amount)}</dd></div>
      </dl>
      {open && <div id={`invoice-${order.id}`} className="mt-4 rounded-xl border border-[#e0eaf2] bg-[#f7faff] p-4" aria-live="polite">
        {loading && <p className="text-sm text-gray-500">Checking your invoice…</p>}
        {invoice?.available && <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-semibold text-[#0b2e59]">Invoice #{invoice.number}</h4>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${invoice.status === "paid" || invoice.payment_sync_pending ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}>
              {invoiceLabel}{invoice.overdue && !invoice.payment_sync_pending ? " · Overdue" : ""}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Invoice total: {money(invoice.total, invoice.currency)} · Balance: {money(invoice.balance, invoice.currency)}
            {invoice.due_date && ` · Due ${new Date(`${invoice.due_date}T00:00:00`).toLocaleDateString()}`}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {pdfUrl ? <a className={buttonClass} href={pdfUrl} target="_blank" rel="noopener noreferrer">Open invoice PDF</a>
              : <button type="button" className={buttonClass} onClick={loadPdf} disabled={pdfBusy || loading}>{pdfBusy ? "Preparing PDF…" : "Get invoice PDF"}</button>}
            {invoice.payment_url && <a href={invoice.payment_url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#0b2e59] px-3 py-2 text-xs font-semibold text-white">Pay invoice</a>}
            <button type="button" className="text-xs text-[#0b2e59] underline disabled:opacity-50" onClick={loadInvoice} disabled={loading || pdfBusy}>Refresh status</button>
          </div>
          {invoice.payment_sync_pending && <p className="mt-3 text-xs text-gray-600">Your payment was received. The invoice balance is still being updated.</p>}
          {!invoice.payment_url && !invoice.payment_sync_pending && Number(invoice.balance) > 0 &&
            <p className="mt-3 text-xs text-gray-600">For payment instructions, contact <a className="underline" href="mailto:order@biopathogenix.com">order@biopathogenix.com</a>.</p>}
        </>}
        {invoice && !invoice.available && <p className="text-sm text-gray-600">{invoice.message} <a className="underline" href="mailto:order@biopathogenix.com">Contact billing</a></p>}
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error} <button type="button" className="underline" onClick={loadInvoice}>Retry</button></p>}
      </div>}
    </section>
  );
}
