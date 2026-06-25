// components/checkout/QbCardInput.tsx
"use client";

import { useMemo, useState } from "react";

import { QbCardData } from "@/types/checkout";
import { detectCardType, getCardBrandColorClass, getCardBrandIconElement } from "@/components/app_icons/app_icons";

interface QbCardInputProps {
  cardData: QbCardData;
  onCardChange: (data: QbCardData) => void;
}

function luhnCheck(num: string): boolean {
  const arr = num
    .split("")
    .reverse()
    .map((x) => parseInt(x, 10));

  const sum = arr.reduce((acc, val, idx) => {
    let next = val;
    if (idx % 2 === 1) {
      next *= 2;
      if (next > 9) next -= 9;
    }
    return acc + next;
  }, 0);

  return sum % 10 === 0;
}

export default function QbCardInput({ cardData, onCardChange }: QbCardInputProps) {
  const [focused, setFocused] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ cardNumber?: string; cvv?: string; cardHolder?: string; expiry?: string }>({});

  const cardType = useMemo(() => detectCardType(cardData.cardNumber), [cardData.cardNumber]);
  const cardBrandIcon = useMemo(() => getCardBrandIconElement(cardType), [cardType]);
  const cardBrandColorClass = useMemo(() => getCardBrandColorClass(cardType), [cardType]);

  const update = (field: keyof QbCardData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onCardChange({ ...cardData, [field]: e.target.value });

  const inputClass = (field: string) =>
    `w-full border rounded-lg px-3 py-3 text-sm text-gray-800 bg-white outline-none transition-all font-[inherit]
    ${focused === field
      ? "border-blue-500 ring-2 ring-blue-100"
      : "border-gray-300 hover:border-gray-400"
    }`;

  const validateCardNumber = () => {
    const digits = cardData.cardNumber.replace(/\D/g, "");
    if (!digits) return "Card number is required";
    if (cardType === "amex" && digits.length !== 15) return "Amex card must have 15 digits";
    if (cardType !== "amex" && digits.length !== 16) return "Card number must have 16 digits";
    if (!luhnCheck(digits)) return "Card number is invalid";
    return "";
  };

  const validateCvv = () => {
    const digits = cardData.cvv.replace(/\D/g, "");
    if (!digits) return "Security code is required";
    if (cardType === "amex" && digits.length !== 4) return "Amex security code must be 4 digits";
    if (cardType !== "amex" && digits.length !== 3) return "Security code must be 3 digits";
    return "";
  };

  const validateCardHolder = () => {
    if (!cardData.cardHolder.trim()) return "Cardholder name is required";
    return "";
  };

  const validateExpiry = () => {
    if (!cardData.expMonth || !cardData.expYear) return "Expiration date is required";

    const month = Number(cardData.expMonth);
    const year = Number(cardData.expYear);
    if (!month || !year) return "Expiration date is invalid";

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return "Card is expired";
    }

    return "";
  };

  function handleBlur(field: "cardHolder" | "cardNumber" | "cvv" | "expiry") {
    let message = "";
    if (field === "cardHolder") message = validateCardHolder();
    if (field === "cardNumber") message = validateCardNumber();
    if (field === "cvv") message = validateCvv();
    if (field === "expiry") message = validateExpiry();

    setErrors((prev) => ({ ...prev, [field]: message || undefined }));
    setFocused(null);
  }

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return (
      <option key={m} value={m}>
        {m}
      </option>
    );
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => {
    const y = String(currentYear + i);
    return (
      <option key={y} value={y}>
        {y}
      </option>
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="card-holder" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Cardholder Name <span className="text-red-500">*</span>
        </label>
        <input
          id="card-holder"
          type="text"
          value={cardData.cardHolder}
          placeholder="Name on card"
          autoComplete="cc-name"
          onChange={update("cardHolder")}
          onFocus={() => setFocused("cardHolder")}
          onBlur={() => handleBlur("cardHolder")}
          className={inputClass("cardHolder")}
        />
        {errors.cardHolder && <p className="text-xs text-red-600">{errors.cardHolder}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="card-number" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Card Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="card-number"
            type="text"
            value={cardData.cardNumber}
            placeholder={cardType === "amex" ? "1234 567890 12345" : "1234 5678 9012 3456"}
            autoComplete="cc-number"
            maxLength={cardType === "amex" ? 17 : 19}
            onChange={(e) => {
              let raw = e.target.value.replace(/\D/g, "");
              raw = cardType === "amex" ? raw.slice(0, 15) : raw.slice(0, 16);

              const formatted =
                cardType === "amex"
                  ? raw.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_m, a, b, c) => [a, b, c].filter(Boolean).join(" "))
                  : raw.match(/.{1,4}/g)?.join(" ") || raw;

              onCardChange({ ...cardData, cardNumber: formatted });
            }}
            onFocus={() => setFocused("cardNumber")}
            onBlur={() => handleBlur("cardNumber")}
            className={inputClass("cardNumber")}
            style={{ paddingRight: 44 }}
          />
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-2xl ${cardBrandColorClass}`} aria-hidden="true">{cardBrandIcon}</span>
        </div>
        {errors.cardNumber && <p className="text-xs text-red-600">{errors.cardNumber}</p>}
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Expiry Date <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={cardData.expMonth}
              onChange={update("expMonth")}
              onFocus={() => setFocused("expMonth")}
              onBlur={() => handleBlur("expiry")}
              className={inputClass("expMonth")}
            >
              <option value="">MM</option>
              {months}
            </select>
            <select
              value={cardData.expYear}
              onChange={update("expYear")}
              onFocus={() => setFocused("expYear")}
              onBlur={() => handleBlur("expiry")}
              className={inputClass("expYear")}
            >
              <option value="">YYYY</option>
              {years}
            </select>
          </div>
          {errors.expiry && <p className="text-xs text-red-600">{errors.expiry}</p>}
        </div>

        <div className="flex flex-col gap-1.5" style={{ width: 120 }}>
          <label htmlFor="card-cvv" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Security Code <span className="text-red-500">*</span>
          </label>
          <input
            id="card-cvv"
            type="password"
            value={cardData.cvv}
            placeholder="***"
            autoComplete="cc-csc"
            maxLength={4}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
              onCardChange({ ...cardData, cvv: raw });
            }}
            onFocus={() => setFocused("cvv")}
            onBlur={() => handleBlur("cvv")}
            className={inputClass("cvv")}
          />
          {errors.cvv && <p className="text-xs text-red-600">{errors.cvv}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className="text-xs text-gray-400">Your card details are encrypted and never stored on our servers.</span>
      </div>
    </div>
  );
}
