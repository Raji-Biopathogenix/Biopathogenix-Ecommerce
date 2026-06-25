"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PaymentMethodServices, SavedPaymentMethod } from "@/services/paymentMethodServices";

function formatBrand(brand: string) {
  if (!brand) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        setLoading(true);
        const response = await PaymentMethodServices.listPaymentMethods();
        setMethods(response?.result?.data ?? []);
      } catch (err) {
        setError(typeof err === "object" && err && "message" in err ? String(err.message) : "Unable to load payment methods.");
      } finally {
        setLoading(false);
      }
    };

    loadPaymentMethods();
  }, []);

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="rounded border border-[#E6EEF5] bg-[#F7FAFD] px-6 py-5 text-sm text-[#0B3C5D]">
          Loading saved payment methods...
        </div>
      ) : methods.length === 0 ? (
        <div className="flex items-center gap-4 rounded border border-[#E6EEF5] bg-[#F7FAFD] px-6 py-5 text-[#0B3C5D]">
          <div className="h-6 w-6 rounded border-2 border-[#CBD5E1] bg-white" />
          <p className="text-sm">No saved methods found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {methods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between rounded border border-[#E6EEF5] bg-white px-6 py-5"
            >
              <div>
                <p className="text-sm font-semibold text-[#0B3C5D]">
                  {formatBrand(method.brand)} ending in {method.last4}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Expires {String(method.exp_month).padStart(2, "0")}/{method.exp_year}
                </p>
                {method.name && (
                  <p className="mt-1 text-sm text-gray-500">{method.name}</p>
                )}
              </div>
              {method.is_default && (
                <span className="rounded-full bg-[#E8F3FB] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#1185C8]">
                  Default
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <Link
          href="/my-account/add-payment-method"
          className="inline-block rounded bg-[#E5EDF4] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#0B3C5D] transition hover:bg-[#D7E6F2]"
        >
          Add Payment Method
        </Link>
      </div>
    </div>
  );
}
