"use client";

import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/env";

type Props = {
  assayType: "custom" | "standard" | "customer_support" | "validation_service" | "sales_quote";
  onSuccess: () => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  initialReason?: string;
};

export default function AssayIntakeForm({
  assayType,
  onSuccess,
  onCancel,
  title,
  subtitle,
  initialReason,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactPreference, setContactPreference] = useState<"call" | "email">("email");
  const [reason, setReason] = useState(initialReason ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReason(initialReason ?? "");
  }, [initialReason]);

  const DJANGO_API = `${API_BASE_URL}/assay-intake/`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !reason.trim()) {
      setError("Please fill Name, Email, and Reason.");
      return;
    }
    if (contactPreference === "call" && !phone.trim()) {
      setError("Please add a phone number if you prefer a call.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(DJANGO_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assayType,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          contactPreference,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to submit");
      }

      onSuccess();
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : "Something went wrong";
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#d5e3f2] bg-white p-3 shadow-sm">
      <div className="text-sm font-semibold text-[#21364b]">
        {title ?? (
          assayType === "custom" ? "Custom Assay Request" :
          assayType === "customer_support" ? "Customer Support Request" :
          assayType === "validation_service" ? "Validation Service Request" :
          assayType === "sales_quote" ? "Sales & Quotes Request" :
          "Standard Assay Request"
        )}
      </div>
      <div className="mb-3 text-xs text-[#5a748d]">
        {subtitle ?? "Share your details and our team will contact you within 24 hours."}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="w-full rounded-xl border border-[#d5e3f2] bg-[#f8fbff] px-3 py-2 text-sm outline-none focus:border-[#0b2e4f]"
          placeholder="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full rounded-xl border border-[#d5e3f2] bg-[#f8fbff] px-3 py-2 text-sm outline-none focus:border-[#0b2e4f]"
          placeholder="Email *"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="rounded-xl border border-[#d5e3f2] bg-[#f8fbff] px-3 py-2">
          <div className="mb-2 text-xs font-medium text-[#5a748d]">Preferred contact</div>
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="contactPreference"
                value="email"
                checked={contactPreference === "email"}
                onChange={() => setContactPreference("email")}
              />
              Email
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="contactPreference"
                value="call"
                checked={contactPreference === "call"}
                onChange={() => setContactPreference("call")}
              />
              Call
            </label>
          </div>
        </div>

        <input
          className="w-full rounded-xl border border-[#d5e3f2] bg-[#f8fbff] px-3 py-2 text-sm outline-none focus:border-[#0b2e4f]"
          placeholder={contactPreference === "call" ? "Phone * (required for call)" : "Phone (optional)"}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <textarea
          className="w-full rounded-xl border border-[#d5e3f2] bg-[#f8fbff] px-3 py-2 text-sm outline-none focus:border-[#0b2e4f]"
          placeholder="Reason / What do you need? *"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {error && <div className="text-xs text-red-600">{error}</div>}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#0b2e4f] px-3 py-2 text-sm text-white hover:bg-[#11406b] disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-[#d5e3f2] px-3 py-2 text-sm text-[#21364b]"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
