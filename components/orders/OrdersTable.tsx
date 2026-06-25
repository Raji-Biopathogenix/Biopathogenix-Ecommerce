

"use client";


import { Order, OrderStatus,ReturnOrderStatus } from "../../types/admin_order";
import { SquarePenIcon } from "../app_icons/app_icons";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  paid:               { label: "Paid",               color: "#065f46", bg: "#d1fae5" },
  pending:            { label: "Pending",            color: "#92400e", bg: "#fef3c7" },
  confirmed:          { label: "Confirmed",          color: "#065f46", bg: "#fef3c7" },
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
  returned:           { label: "Returned",           color: "#991b1b", bg: "#fee2e2" },
  completed:          { label: "Completed",          color: "#065f46", bg: "#d1fae5" },
  cancelled:          { label: "Cancelled",          color: "#991b1b", bg: "#fee2e2" },
  partially_refunded: { label: "Partially Refunded", color: "#92400e", bg: "#fef3c7" },
  refunded:           { label: "Refunded",           color: "#991b1b", bg: "#fee2e2" },
};



interface OrdersTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  handleOrderEdit : (order:Order) => void
  handleCancelRefund: (order: Order) => void;
}



export default function OrdersTable({ orders, handleOrderEdit,onViewOrder,handleCancelRefund }:OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div style={{
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: "60px 20px",
        textAlign: "center",
        color: "#9ca3af",
        fontSize: 14,
      }}>
        No orders match your filters
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {["Order ID", "Customer", "Date", "Items", "Total", "Status", "", "Edit","Cancel/Refund"].map((h) => (
                <th key={h} style={{
                  padding: "12px 16px",
                  fontSize: 11, fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase", letterSpacing: "0.07em",
                  textAlign: "left",
                  textWrap:"nowrap"
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => {
              console.log("order in table",order.status,STATUS_CONFIG[order.status]);
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

              return (
                <tr key={order.id} style={{
                  borderBottom: idx === orders.length - 1 ? "none" : "1px solid #f3f4f6",
                  backgroundColor: "#ffffff",
                }}>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      fontFamily: "monospace", fontWeight: 700, fontSize: 12,
                      color: "#0b76d1",
                      backgroundColor: "#eff6ff",
                      padding: "3px 8px", borderRadius: 6,
                    }}>
                      {order.id}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#111111" }}>{order.customer}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{order.email}</div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#6b7280",textWrap:"nowrap" }}>
                    {new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#374151" }}>
                    {order.items_count}
                    <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 4 }}>
                      item{order.items_count > 1 ? "s" : ""}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#111111" }}>
                    ${order.amount}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 20,
                      fontSize: 12, fontWeight: 600,
                      backgroundColor: cfg.bg, color: cfg.color,
                      textWrap:"nowrap" 
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg.color ,textWrap:"nowrap" }} />
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      onClick={() => onViewOrder(order)}
                      style={{
                        fontSize: 12, fontWeight: 600,
                        padding: "6px 16px", borderRadius: 8, cursor: "pointer",
                        backgroundColor: "#0b76d1",
                        border: "none",
                        color: "#ffffff",
                      }}
                    >
                      View
                    </button>
                  </td>

                

                  <td style={{ padding: "14px 16px" }}>
                    <> 
                    <button
                    className="ms-2"
                      // onClick={() => handleOrderEdit({"order":order,type:"return_rejected"})}
                      onClick={() => handleOrderEdit(order)}
                      style={{
                        fontSize: 12, fontWeight: 600,
                        padding: "6px 16px", borderRadius: 8, cursor: "pointer",
                        backgroundColor: "red",
                        border: "none",
                        color: "#ffffff",
                      }}
                    >
                      <SquarePenIcon />
                    </button></>
                  </td>

                   <td style={{ padding: "14px 16px" }}>
                    { (order?.is_cancellable || order?.is_refundable )  && <button
                      onClick={() => handleCancelRefund(order)}
                      style={{
                        fontSize: 12, fontWeight: 600,
                        padding: "6px 16px", borderRadius: 8, cursor: "pointer",
                        backgroundColor: "#0b76d1",
                        border: "none",
                        color: "#ffffff",
                      }}
                    >
                     {order?.is_cancellable ? 'Cancel' : order?.is_refundable ?  'Refund' : ''}
                    </button>}
                  </td>
                 
                  
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}