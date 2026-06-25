"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OrderServices } from "@/services/orderServices";
import { OrderSummary } from "@/types/order";

const formatDateParts = (value: string) => {
  const date = new Date(value);
  const monthDay = new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
  }).format(date);
  const year = date.getFullYear().toString();
  return { monthDay, year };
};

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    typeof value === "number" ? value : Number(value || 0),
  );

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order_number");
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) {
        setError("No order number provided.");
        setLoading(false);
        return;
      }

      try {
        const payload = await OrderServices.fetchUserOrders();
        const found = payload.result.data.find(
          (item) => item.order_number === orderNumber,
        );
        if (!found) {
          setError("We could not locate that order. Try logging in again.");
        } else {
          setOrder(found);
        }
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your order details right now.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  const footerMessage = useMemo(() => {
    if (!order) return "";
    if (order.payment_method.toLowerCase() === "invoice") {
      return "Thank you! You'll be invoiced soon to pay for your order.";
    }
    return "Thank you! Your payment was processed and the order is received.";
  }, [order]);

  if (loading) {
    return (
      <div className="px-6 py-16 text-center text-[#0b2e59]">
        <p className="text-sm text-gray-500">Loading order details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-16 text-center text-sm text-red-600">{error}</div>
    );
  }

  if (!order) {
    return null;
  }

  const dateParts = formatDateParts(order.created_at);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 text-[#0b2e59]">
      <h1 className="text-4xl font-semibold mb-2">Checkout</h1>
      <p className="text-sm text-gray-500 mb-10">
        Review the order confirmation below. A full copy has also been emailed to you.
      </p>

      <section className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#d5dfea] bg-[#f6f7fb] shadow-sm">
          <svg
            className="w-8 h-8 text-[#0b2e59]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-[#0b2e59]">Order received</p>
          <p className="text-base text-[#4f5c7d]">
            Thank you {order.customer_name}! Your order has been received.
          </p>
        </div>
      </section>

      <div className="rounded-[36px] border border-[#e6eef5] bg-white p-6 shadow-[0_20px_55px_rgba(15,32,66,0.1)]">
        <div className="overflow-x-auto">
          <div className="min-w-[700px] grid grid-cols-5 gap-6 text-sm text-[#4a5b7a]">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.45em] text-[#a2adbe]">Order Number</p>
              <p className="text-2xl font-semibold text-[#0b2e59]">{order.order_number}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.45em] text-[#a2adbe]">Date</p>
              <p className="text-lg font-semibold text-[#0b2e59] leading-snug">
                <span className="block">{dateParts.monthDay}</span>
                <span className="block text-sm font-medium text-[#4f5c7d]">{dateParts.year}</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.45em] text-[#a2adbe]">Email</p>
              <p className="text-sm font-medium text-[#0b2e59] break-words max-w-[220px]">
                {order.customer_email}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.45em] text-[#a2adbe]">Total</p>
              <p className="text-lg font-semibold text-[#0b2e59]">{formatCurrency(order.amount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.45em] text-[#a2adbe]">Payment Method</p>
              <p className="text-lg font-semibold text-[#0b2e59]">{order.payment_method_display}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-[#4b5c7d]">{footerMessage}</p>

      <section className="mt-10 space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-[#0b2e59]">Order details</h3>
          <div className="mt-4 text-sm text-gray-600">
            <p className="mb-2">
              <span className="font-semibold text-[#0b2e59]">Tracking number:</span>{" "}
              {order.tracking_number || "Not assigned yet"}
            </p>
            <p>
              <span className="font-semibold text-[#0b2e59]">Shipping:</span>{" "}
              {order.shipping_summary}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={`${order.id}-${item.product_name}`}
              className="flex items-center justify-between rounded-2xl border border-[#e6eef5] bg-[#fafbfe] p-4"
            >
              <p className="font-medium text-[#0b2e59]">{item.product_name}</p>
              <p className="text-sm text-gray-500">
                Qty {item.quantity} · {formatCurrency(item.total)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
