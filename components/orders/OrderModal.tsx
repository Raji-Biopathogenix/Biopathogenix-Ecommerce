"use client";

import { useEffect } from "react";
import { Order, OrderStatus,OrderItem } from "../../types/admin_order";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; }
> = {
  // pending:    { label: "Pending",    dot: "bg-amber-400",  bg: "bg-amber-400/10",  text: "text-amber-400" },
  // processing: { label: "Processing", dot: "bg-blue-400",   bg: "bg-blue-400/10",   text: "text-blue-400" },
  // shipped:    { label: "Shipped",    dot: "bg-sky-400",    bg: "bg-sky-400/10",    text: "text-sky-400" },
  // delivered:  { label: "Delivered",  dot: "bg-emerald-400",bg: "bg-emerald-400/10",text: "text-emerald-400" },
  // cancelled:  { label: "Cancelled",  dot: "bg-red-400",    bg: "bg-red-400/10",    text: "text-red-400" },
  paid:               { label: "Paid",               color: "#065f46", bg: "#d1fae5" },
  pending:            { label: "Pending",            color: "#92400e", bg: "#fef3c7" },
  confirmed:          { label: "Confirmed",          color: "#1e40af", bg: "#dbeafe" },
  processing:         { label: "Processing",         color: "#1e40af", bg: "#dbeafe" },
  partially_shipped:  { label: "Partially Shipped",  color: "#075985", bg: "#e0f2fe" },
  shipped:            { label: "Shipped",            color: "#075985", bg: "#e0f2fe" },
  partially_delivered:{ label: "Partially Delivered",color: "#065f46", bg: "#d1fae5" },
  delivered:          { label: "Delivered",          color: "#065f46", bg: "#d1fae5" },
  out_for_delivery:   { label: "Out for Delivery",   color: "#065f46", bg: "#fef3c7" },
  return_requested:   { label: "Return Requested",   color: "#991b1b", bg: "#fee2e2" },
  return_approved:    { label: "Return Approved",    color: "#065f46", bg: "#d1fae5" },
  return_rejected:    { label: "Return Rejected",    color: "#991b1b", bg: "#fee2e2" },
  partially_returned: { label: "Partially Returned", color: "#92400e", bg: "#fef3c7" },
  returned:           { label: "Returned",           color: "#92400e", bg: "#fef3c7" },
  completed:          { label: "Completed",          color: "#065f46", bg: "#d1fae5" },
  cancelled:          { label: "Cancelled",          color: "#991b1b", bg: "#fee2e2" },
  partially_refunded: { label: "Partially Refunded", color: "#92400e", bg: "#fef3c7" },
  refunded:           { label: "Refunded",           color: "#92400e", bg: "#fef3c7" },
};

interface OrderModalProps {
  order: Order;
  onClose: () => void;
  items : OrderItem[] | null
}

export default function OrderModal({items, order, onClose }: OrderModalProps) {
  console.log("items",items)
  const cfg = STATUS_CONFIG[order.status];
  const subtotal = items? items.reduce((s, i) => s + i.unit_price * i.quantity, 0) : 0;
  const tax = subtotal * 0.18;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);




  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
        backgroundColor: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div style={{
        position: "relative",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        width: "100%", maxWidth: 640,
        maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        color: "#111111",
      }}>
 
        <div style={{ padding: "22px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{
                fontFamily: "monospace", fontWeight: 700, fontSize: 13,
                color: "#0b76d1", backgroundColor: "#eff6ff",
                padding: "3px 10px", borderRadius: 6,
              }}>
                {order.id}
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 10px", borderRadius: 20,
                fontSize: 12, fontWeight: 600,
                backgroundColor: cfg?.bg, color: cfg?.color,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg?.color }} />
                {cfg?.label}
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#111111" }}>{order.customer}</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>{order.email}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: "#f3f4f6",
              border: "1px solid #e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#6b7280",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
 
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>
 
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Order Date", value: new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
              { label: "Payment",    value: order.payment_method_display },
              { label: "Delivery Address", value: order.shipping_address_line1 },
              { label: "Total Items", value: `${order.items_count} item${order.items_count > 1 ? "s" : ""}` },
            ].map((meta) => (
              <div key={meta.label} style={{
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 12, padding: "12px 14px",
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {meta.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111111", lineHeight: 1.4 }}>
                  {meta.value}
                </div>
              </div>
            ))}
          </div>
 
          {/* Items heading */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
            Order Items
          </div>
 
          {/* Items table */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 60px 80px 80px",
              padding: "10px 14px",
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              fontSize: 11, fontWeight: 700,
              color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              <span>Product</span>
              <span style={{ textAlign: "center" }}>Qty</span>
              <span style={{ textAlign: "right" }}>Price</span>
              <span style={{ textAlign: "right" }}>Total</span>
            </div>
            {items && items.map((item, idx) => (
              <div key={item.id} style={{
                display: "grid", gridTemplateColumns: "1fr 60px 80px 80px",
                padding: "12px 14px", alignItems: "center",
                borderBottom: idx !== order.items_count - 1 ? "1px solid #f3f4f6" : "none",
                backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa",
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#111111" }}>{item.product_name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace", marginTop: 2 }}>{item.sku_code}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{
                    fontSize: 12, color: "#374151",
                    backgroundColor: "#f3f4f6",
                    padding: "2px 8px", borderRadius: 20,
                  }}>
                    ×{item.quantity}
                  </span>
                </div>
                <div style={{ textAlign: "right", fontSize: 13, color: "#6b7280" }}>
                  ${item.unit_price}
                </div>
                <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "#111111" }}>
                  ${(item.unit_price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
 
          {/* Totals */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>
            {[
              { label: "Subtotal",   value: subtotal },
              // { label: "GST (18%)", value: tax },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: "#6b7280" }}>{row.label}</span>
                <span style={{ color: "#374151" }}>${row.value.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #e5e7eb", marginTop: 4 }}>
              <span style={{ fontWeight: 700, color: "#111111", fontSize: 15 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#0b76d1" }}>
                ${order.amount}
              </span>
            </div>
          </div>
        </div>
 
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600,
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              color: "#374151", cursor: "pointer",
            }}
          >
            Close
          </button>
         
        </div>
      </div>
    </div>
  );
}
