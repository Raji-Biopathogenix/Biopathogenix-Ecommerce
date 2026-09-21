"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import QbCardInput from "@/components/checkout/QbCardInput";
import { QbCardData } from "@/types/checkout";
import { PaymentMethodServices } from "@/services/paymentMethodServices";

export default function AddPaymentMethodPage() {
  const router = useRouter();
  const [card, setCard] = useState<QbCardData>({cardHolder: "", cardNumber: "", expMonth: "", expYear: "", cvv: ""});
  const [zip, setZip] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!consent) { setError("Please confirm that you want to save this card."); return; }
    setBusy(true);
    setError("");
    try {
      await PaymentMethodServices.saveQuickBooksCard({
        card_name: card.cardHolder.trim(), card_number: card.cardNumber.replace(/\D/g, ""),
        card_exp_month: card.expMonth, card_exp_year: card.expYear,
        save_payment_method: consent, billing: {postal_code: zip.trim()},
      });
      setCard({cardHolder: "", cardNumber: "", expMonth: "", expYear: "", cvv: ""});
      router.push("/my-account/payment-methods");
    } catch (cause) {
      setError(typeof cause === "object" && cause && "message" in cause ? String(cause.message) : "Unable to save this card. Please try again.");
    } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="max-w-xl space-y-6">
    <h1 className="text-xl font-semibold text-[#0B3C5D]">Add payment method</h1>
    <QbCardInput cardData={card} onCardChange={setCard} collectCvv={false} />
    <label className="block text-sm text-[#0B3C5D]">Billing ZIP code
      <input required pattern="[0-9]{5}" inputMode="numeric" autoComplete="billing postal-code" value={zip} onChange={event => setZip(event.target.value)} className="mt-2 block w-full rounded border p-3" />
    </label>
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} />
      Save this card securely for future purchases
    </label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={busy || !consent} className="rounded bg-[#0B3C5D] px-6 py-3 text-white disabled:opacity-50">{busy ? "Saving..." : "Save card"}</button>
  </form>;
}
