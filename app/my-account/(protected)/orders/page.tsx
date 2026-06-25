"use client";

import { useEffect, useState, useMemo } from "react";
import { OrderServices } from "@/services/orderServices";
import { OrderSummary, OrderShipment, OrderItem } from "@/types/order";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import ReturnRequestModal from "@/components/Modal/Order/ReturnRequestModal";

// ─── Label maps ────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  pending:             "Pending",
  confirmed:           "Confirmed",
  processing:          "Processing",
  partially_shipped:   "Partially Shipped",
  shipped:             "Shipped",
  partially_delivered: "Partially Delivered",
  delivered:           "Delivered",
  completed:           "Completed",
  refunded:            "Refunded",
  partially_refunded:  "Partially Refunded",
  cancelled:           "Cancelled",
  return_initiate:     "Return Initiated",
  partially_returned:  "Partially Returned",
  returned:            "Returned",
  return_requested:    "Return Requested",
  return_approved:     "Return Approved",
  return_rejected:     "Return Rejected",
};

const STATUS_BADGE: Record<string, string> = {
  pending:             "bg-yellow-50 text-yellow-700 border border-yellow-200",
  confirmed:           "bg-blue-50 text-blue-700 border border-blue-200",
  processing:          "bg-indigo-50 text-indigo-700 border border-indigo-200",
  partially_shipped:   "bg-orange-50 text-orange-700 border border-orange-200",
  shipped:             "bg-orange-50 text-orange-700 border border-orange-200",
  partially_delivered: "bg-teal-50 text-teal-700 border border-teal-200",
  delivered:           "bg-green-50 text-green-700 border border-green-200",
  completed:           "bg-green-100 text-green-800 border border-green-300",
  cancelled:           "bg-red-50 text-red-600 border border-red-200",
  refunded:            "bg-gray-100 text-gray-600 border border-gray-300",
  partially_refunded:  "bg-gray-100 text-gray-600 border border-gray-300",
  return_initiate:     "bg-purple-50 text-purple-700 border border-purple-200",
  return_requested:    "bg-purple-50 text-purple-700 border border-purple-200",
  partially_returned:  "bg-purple-50 text-purple-700 border border-purple-200",
  returned:            "bg-purple-100 text-purple-800 border border-purple-300",
};

// ─── Order-level progress ──────────────────────────────────────────────────────
const ORDER_STEPS = [
  { label: "Order\nConfirmed", key: "confirmed" },
  { label: "Processing",       key: "processing" },
  { label: "Shipped",          key: "shipped" },
  { label: "Delivered",        key: "delivered" },
  { label: "Completed",        key: "completed" },
];
const STATUS_TO_STEP: Record<string, number> = {
  pending: 0, confirmed: 0,
  processing: 1,
  partially_shipped: 2, shipped: 2,
  partially_delivered: 3, delivered: 3,
  completed: 4,
};

// ─── Shipment-level progress ───────────────────────────────────────────────────
const SHIPMENT_STEPS = [
  { key: "label_created", label: "Label\nCreated" },
  { key: "picked_up",     label: "Shipped" },
  { key: "in_transit",    label: "In Transit" },
  { key: "delivered",     label: "Delivered" },
];
const SHIPMENT_STATUS_TO_STEP: Record<string, number> = {
  label_created: 0,
  picked_up:     1,
  in_transit:    2,
  delivered:     3,
};
const SHIPMENT_STATUS_LABEL: Record<string, { text: string; color: string }> = {
  label_created: { text: "Label Created",  color: "text-blue-600 bg-blue-50 border-blue-200" },
  picked_up:     { text: "Shipped",        color: "text-blue-700 bg-blue-100 border-blue-300" },
  in_transit:    { text: "In Transit",     color: "text-orange-600 bg-orange-50 border-orange-200" },
  delivered:     { text: "Delivered",      color: "text-green-700 bg-green-50 border-green-200" },
  cancelled:     { text: "Cancelled",      color: "text-red-600 bg-red-50 border-red-200" },
};

const ITEM_STATUS_LABEL: Record<string, string> = {
  label_created: "Label Created",
  picked_up:     "Shipped",
  in_transit:    "In Transit",
  delivered:     "Delivered",
  returned:      "Returned",
};

const TERMINAL = new Set(["cancelled", "refunded", "partially_refunded"]);
const RETURNS  = new Set(["return_requested", "return_initiate", "returned", "partially_returned"]);

const fmt  = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const fmtT = (iso: string) => new Date(iso).toLocaleString(undefined,    { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

// ─── ShipmentCard component ────────────────────────────────────────────────────
function ShipmentCard({
  shipment, index, total, orderItems,
}: {
  shipment: OrderShipment;
  index: number;
  total: number;
  orderItems: OrderItem[];
}) {
  const step       = SHIPMENT_STATUS_TO_STEP[shipment.status] ?? -1;
  const isDelivered = shipment.status === "delivered";
  const statusCfg  = SHIPMENT_STATUS_LABEL[shipment.status];
  const activeColor = isDelivered ? "bg-green-600" : "bg-[#0b2e59]";
  const lineColor   = isDelivered ? "bg-green-500" : "bg-[#0b2e59]";

  // match items to this shipment by product_name
  const shipmentItemNames = new Set(shipment.items.map((i) => i.product_name));
  const matchedItems = orderItems.filter((i) => shipmentItemNames.has(i.product_name));

  return (
    <div className="border border-[#e0eaf2] rounded-xl overflow-hidden">
      {/* Shipment header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#f4f8fc] border-b border-[#e0eaf2]">
        <div className="flex items-center gap-2.5">
          {/* Box icon */}
          <div className="w-7 h-7 rounded-lg bg-[#0b2e59]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#0b2e59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-[#0b2e59]">
              Shipment {index + 1}
              <span className="font-normal text-gray-400"> of {total}</span>
            </p>
            <p className="text-[10px] text-gray-400">{shipment.carrier} · {shipment.items.length} item{shipment.items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {statusCfg && (
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${statusCfg.color}`}>
              {statusCfg.text}
            </span>
          )}
          {shipment.tracking_number ? (
            <a
              href={shipment.tracking_url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-[#0b2e59] hover:underline"
            >
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {shipment.tracking_number}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : (
            <span className="text-[11px] text-gray-400 italic">Tracking not assigned yet</span>
          )}
        </div>
      </div>

      {/* Shipment progress stepper */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start">
          {SHIPMENT_STEPS.map((s, i) => {
            const done   = step >= i;
            const active = step === i;
            return (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all
                    ${done ? activeColor + " text-white" : "bg-[#eef3f8] text-gray-400"}`}
                  >
                    {done && !active ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-[11px] font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-[9px] font-semibold uppercase tracking-wide text-center whitespace-pre-line leading-tight
                    ${done ? (isDelivered ? "text-green-600" : "text-[#0b2e59]") : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < SHIPMENT_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all
                    ${step > i ? lineColor : "bg-[#e6eef5]"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Items in this shipment */}
      {matchedItems.length > 0 && (
        <div className="border-t border-[#f0f5fa] mx-4 mb-4">
          {matchedItems.map((item, ii) => {
            const itemStatusLabel = item.is_cancelled
              ? "Cancelled"
              : item.status
              ? (ITEM_STATUS_LABEL[item.status] ?? item.status)
              : "Awaiting Shipment";
            const itemStatusColor = item.is_cancelled
              ? "text-red-500"
              : item.status === "delivered" ? "text-green-600"
              : item.status === "in_transit" ? "text-orange-500"
              : item.status ? "text-blue-600"
              : "text-gray-400";
            return (
              <div key={ii} className="flex items-center justify-between py-2.5 border-b border-[#f0f5fa] last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.is_cancelled ? "bg-red-400" : item.status === "delivered" ? "bg-green-500" : item.status ? "bg-blue-400" : "bg-gray-300"}`} />
                  <span className="text-sm text-gray-800 font-medium truncate">{item.product_name}</span>
                  <span className="text-xs text-gray-400 shrink-0">× {item.quantity}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${itemStatusColor}`}>{itemStatusLabel}</span>
                  <span className="text-sm font-semibold text-gray-700 w-16 text-right">${Number(item.total).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { setToastNotification } = useToast();
  const { setShowMainPageLoader } = useAuth();

  const [orders, setOrders]           = useState<OrderSummary[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [returnOrder, setReturnOrder] = useState<OrderSummary | null>(null);
  const [search, setSearch]           = useState("");
  const [expanded, setExpanded]       = useState<Set<number>>(new Set());

  useEffect(() => {
    OrderServices.fetchUserOrders()
      .then((p) => setOrders(p.result.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load orders."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        (o.tracking_number ?? "").toLowerCase().includes(q) ||
        (o.shipments ?? []).some((s) => (s.tracking_number ?? "").toLowerCase().includes(q))
    );
  }, [orders, search]);

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleReturnRequest = async (order_id: Number, note: string) => {
    setShowMainPageLoader(true);
    try {
      const res = await OrderServices.OrderReturnReq(order_id, note);
      if (res?.status === "success") {
        setOrders((prev) => prev.map((o) => (o.id === order_id ? { ...o, status: "return_requested" } : o)));
        setReturnOrder(null);
        setToastNotification({ type: "success", message: res.message });
      }
    } catch (e: any) {
      setToastNotification({ type: "error", message: e?.message });
    } finally {
      setShowMainPageLoader(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0b2e59] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading your orders…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );

  return (
    <div className="space-y-6 py-6 max-w-4xl">
      {returnOrder && (
        <ReturnRequestModal order={returnOrder} onClose={() => setReturnOrder(null)} onSubmit={handleReturnRequest} />
      )}

      {/* ── Header + Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0b2e59]">My Orders</h2>
          <p className="text-sm text-gray-400 mt-0.5">{orders.length} order{orders.length !== 1 ? "s" : ""} total</p>
        </div>
        <div className="relative w-full sm:w-80">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by order # or tracking number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#dce8f0] rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-[#0b2e59]/20 focus:border-[#0b2e59] bg-white"
          />
        </div>
      </div>

      {/* ── Empty ── */}
      {filtered.length === 0 && (
        <div className="bg-white border border-[#e6eef5] rounded-2xl p-12 text-center">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 text-sm">
            {search ? `No orders match "${search}"` : "You haven't placed any orders yet."}
          </p>
        </div>
      )}

      {/* ── Order Cards ── */}
      {filtered.map((order) => {
        const isExpanded  = expanded.has(order.id);
        const badgeClass  = STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600 border border-gray-200";
        const isTerminal  = TERMINAL.has(order.status);
        const isReturn    = RETURNS.has(order.status);
        const currentStep = STATUS_TO_STEP[order.status] ?? 0;
        const shipments   = (order.shipments ?? []) as OrderShipment[];

        // items not in any shipment
        const shippedItemNames = new Set(shipments.flatMap((s) => s.items.map((i) => i.product_name)));
        const unshippedItems   = order.items.filter((i) => !shippedItemNames.has(i.product_name) && !i.is_cancelled);
        const cancelledItems   = order.items.filter((i) => i.is_cancelled);

        return (
          <section key={order.id} className="bg-white border border-[#e6eef5] rounded-2xl shadow-sm overflow-hidden">

            {/* ── Card Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 bg-[#f8fbfd] border-b border-[#e6eef5]">
              <div className="flex items-center gap-5 flex-wrap">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-0.5">Order</p>
                  <p className="text-sm font-bold text-[#0b2e59]">{order.order_number}</p>
                </div>
                <div className="w-px h-7 bg-[#e0eaf2]" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-0.5">Placed</p>
                  <p className="text-sm text-gray-700 font-medium">{fmt(order.created_at)}</p>
                </div>
                <div className="w-px h-7 bg-[#e0eaf2]" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-0.5">Total</p>
                  <p className="text-sm font-bold text-[#0b2e59]">${Number(order.amount).toFixed(2)}</p>
                </div>
                <div className="w-px h-7 bg-[#e0eaf2]" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-0.5">Items</p>
                  <p className="text-sm font-medium text-gray-700">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${badgeClass}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
                <button
                  onClick={() => toggle(order.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#0b2e59] hover:text-[#1a4f8a]
                             border border-[#c8dcea] rounded-lg px-3 py-1.5 hover:bg-[#eef5fb] transition-all"
                >
                  {isExpanded ? "Hide Details" : "View Details"}
                  <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Order-level Progress Bar ── */}
            <div className="px-6 py-5 border-b border-[#e6eef5]">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-semibold mb-4">Order Progress</p>

              {!isTerminal && !isReturn ? (
                <div className="flex items-start">
                  {ORDER_STEPS.map((s, i) => {
                    const done   = currentStep >= i;
                    const active = currentStep === i;
                    return (
                      <div key={s.key} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all
                            ${done ? "bg-[#0b2e59] text-white" : "bg-[#eef3f8] text-gray-400"}`}>
                            {done && !active ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="text-[11px] font-bold">{i + 1}</span>
                            )}
                          </div>
                          <span className={`text-[9px] font-semibold uppercase tracking-wide whitespace-pre-line text-center leading-tight
                            ${done ? "text-[#0b2e59]" : "text-gray-400"}`}>
                            {s.label}
                          </span>
                        </div>
                        {i < ORDER_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-2 mb-6 rounded-full transition-all
                            ${currentStep > i ? "bg-[#0b2e59]" : "bg-[#e6eef5]"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : isTerminal ? (
                <div className="flex items-center gap-3 py-2 px-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-600">{STATUS_LABELS[order.status]}</p>
                    <p className="text-xs text-red-400">This order has been {STATUS_LABELS[order.status]?.toLowerCase()}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2 px-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-purple-700">{STATUS_LABELS[order.status]}</p>
                    <p className="text-xs text-purple-400">Our team is processing your return</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Shipment Trackers ── */}
            <div className="px-6 py-5 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-semibold">
                Shipments
                {shipments.length > 0 && (
                  <span className="ml-2 normal-case text-gray-400 font-normal tracking-normal">
                    ({shipments.length} of {shipments.length} dispatched)
                  </span>
                )}
              </p>

              {shipments.length === 0 ? (
                <div className="flex items-center gap-3 py-4 px-4 bg-[#f8fbfd] rounded-xl border border-dashed border-[#c8dcea]">
                  <div className="w-8 h-8 rounded-full bg-[#eef3f8] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">No shipments yet</p>
                    <p className="text-xs text-gray-400">Your order is being prepared. Tracking info will appear here once shipped.</p>
                  </div>
                </div>
              ) : (
                shipments.map((shipment, si) => (
                  <ShipmentCard
                    key={shipment.id}
                    shipment={shipment}
                    index={si}
                    total={shipments.length}
                    orderItems={order.items}
                  />
                ))
              )}

              {/* Unshipped items */}
              {unshippedItems.length > 0 && (
                <div className="border border-dashed border-[#c8dcea] rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-2">Awaiting Shipment</p>
                  {unshippedItems.map((item, ii) => (
                    <div key={ii} className="flex items-center justify-between py-1.5 border-b border-[#f0f5fa] last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        <span className="text-sm text-gray-600">{item.product_name}</span>
                        <span className="text-xs text-gray-400">× {item.quantity}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">${Number(item.total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cancelled items */}
              {cancelledItems.length > 0 && (
                <div className="border border-red-100 rounded-xl px-4 py-3 bg-red-50/40">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-red-400 font-semibold mb-2">Cancelled Items</p>
                  {cancelledItems.map((item, ii) => (
                    <div key={ii} className="flex items-center justify-between py-1.5 border-b border-red-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="text-sm text-red-500 line-through">{item.product_name}</span>
                        <span className="text-xs text-red-400">× {item.quantity}</span>
                      </div>
                      <span className="text-sm font-semibold text-red-400">${Number(item.total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Expanded Details ── */}
            {isExpanded && (
              <div className="border-t border-[#e6eef5] bg-[#fafcfe] px-6 py-5 space-y-5">

                {/* Shipping address */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#eef3f8] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#0b2e59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-0.5">Shipping To</p>
                    <p className="text-sm text-gray-700">{order.shipping_summary}</p>
                  </div>
                </div>

                {/* Order timeline */}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-3">Order Timeline</p>
                  <div className="relative pl-5 space-y-4">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#e6eef5]" />
                    {[...order.status_updates].reverse().map((u, i) => (
                      <div key={i} className="flex gap-3 relative">
                        <div className="w-3 h-3 rounded-full bg-[#0b2e59] shrink-0 mt-0.5 -ml-5 ring-2 ring-white" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[#0b2e59]">{STATUS_LABELS[u.status] ?? u.status}</p>
                            <span className="text-[11px] text-gray-400 shrink-0">{fmtT(u.created_at)}</span>
                          </div>
                          {u.notes && <p className="text-xs text-gray-500 mt-0.5">{u.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Return button */}
                {order.is_return_eligible && (
                  <button
                    onClick={() => setReturnOrder(order)}
                    className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Request Return
                  </button>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
