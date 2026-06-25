"use client";
import { Order, OrderStatus } from "../../types/admin_order";

const STATUSES: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

interface FilterBarProps {
  orderId: string;
  status: string;
  onOrderIdChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  resultCount: number;
}

export default function FilterBar({ orderId, status, onOrderIdChange, onStatusChange, resultCount }:FilterBarProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>

        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}
            width="14" height="14" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search by Order ID…"
            value={orderId}
            onChange={(e) => onOrderIdChange(e.target.value)}
            style={{
              paddingLeft: 32, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: 10,
              fontSize: 13,
              color: "#111111",
              outline: "none",
              width: 230,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => onStatusChange(s.value)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: status === s.value ? "none" : "1px solid #d1d5db",
                backgroundColor: status === s.value ? "#0b76d1" : "#ffffff",
                color: status === s.value ? "#ffffff" : "#374151",
                transition: "all 0.15s",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <span style={{ fontSize: 12, color: "#9ca3af" }}>
        {resultCount} {resultCount === 1 ? "order" : "orders"} found
      </span>
    </div>
  );
}