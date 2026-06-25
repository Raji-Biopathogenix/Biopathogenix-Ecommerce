"use client";

import { FormEvent, useRef, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";

import StripeCardInput, { StripeCardInputRef } from "@/components/checkout/StripeCardInput";
import { stripePromise } from "@/lib/stripe";
import { PaymentMethodServices } from "@/services/paymentMethodServices";

type FormState = {
  cardHolder: string;
  country: string;
  zip: string;
};

const INITIAL_FORM: FormState = {
  cardHolder: "",
  country: "US",
  zip: "",
};

function AddPaymentMethodForm() {
  const router = useRouter();
  const stripeRef = useRef<StripeCardInputRef>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isCardComplete, setIsCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  const updateField =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const validate = () => {
    if (!form.cardHolder.trim()) {
      return "Cardholder name is required.";
    }
    if (!form.zip.trim()) {
      return "ZIP code is required.";
    }
    if (!isCardComplete) {
      return cardError || "Please complete your card details.";
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);

    const validationMessage = validate();
    if (validationMessage) {
      setMessage(validationMessage);
      setMessageType("error");
      return;
    }

    if (!stripeRef.current) {
      setMessage("Card form is not ready. Please refresh and try again.");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    try {
      const setupIntent = await PaymentMethodServices.createSetupIntent();
      const { paymentMethodId } = await stripeRef.current.createSetupPaymentMethod({
        clientSecret: setupIntent.client_secret,
        cardHolderName: form.cardHolder.trim(),
        country: form.country,
        postalCode: form.zip.trim(),
      });
      await PaymentMethodServices.savePaymentMethod(paymentMethodId);

      setMessage("Payment method saved successfully.");
      setMessageType("success");
      setTimeout(() => {
        router.push("/my-account/payment-methods");
      }, 800);
    } catch (error) {
      const fallback = "Unable to save payment method. Please try again.";
      setMessage(typeof error === "object" && error && "message" in error ? String(error.message) : fallback);
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-3 text-sm text-[#0B3C5D]">
          <input type="radio" defaultChecked className="h-4 w-4 accent-blue-600" />
          Card
        </label>
        <div className="h-6 w-10 rounded bg-gray-200" />
      </div>

      <div className="space-y-6 rounded border border-[#E6EEF5] bg-white p-6">
        <StripeCardInput
          ref={stripeRef}
          cardHolder={form.cardHolder}
          onCardHolderChange={(value) => setForm((prev) => ({ ...prev, cardHolder: value }))}
          onChange={(complete, error) => {
            setIsCardComplete(complete);
            setCardError(error);
          }}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-[#0B3C5D]">Country</label>
            <select
              value={form.country}
              onChange={updateField("country")}
              className="w-full rounded border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="US">United States</option>
              <option value="IN">India</option>
              <option value="GB">United Kingdom</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-[#0B3C5D]">ZIP code</label>
            <input
              type="text"
              value={form.zip}
              onChange={updateField("zip")}
              placeholder="12345"
              className="w-full rounded border border-gray-300 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <p className="text-sm text-gray-600">
          By providing your card information, you allow BioPathogenix to charge your card
          for future payments in accordance with their terms.
        </p>

        {message && (
          <div
            className={`rounded border px-4 py-3 text-sm ${
              messageType === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center rounded bg-[#1185C8] px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#0E6FA8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Add Payment Method"}
      </button>
    </form>
  );
}

export default function AddPaymentMethodPage() {
  return (
    <Elements stripe={stripePromise}>
      <AddPaymentMethodForm />
    </Elements>
  );
}
