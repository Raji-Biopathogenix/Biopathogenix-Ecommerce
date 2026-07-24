"use client";

import { useState } from "react";
import { LandingPageType } from "@/types/header";
import OffersCarouselModal from "../Modal/offersModal";

interface OffersSectionProps {
  result?: LandingPageType;
}

function getPlainText(content?: string) {
  if (!content) return "";
  return content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getOfferTabContent(offer: LandingPageType["contexts"][number], index: number) {
  const title = getPlainText(offer.title);
  const shortDescription = getPlainText(offer.short_description);
  const description = getPlainText(offer.description);
  const combined = [title, shortDescription, description].filter(Boolean).join(" ");
  const discountMatch = combined.match(/\d+\s*%(\s*off)?/i);
  const discount = discountMatch?.[0]?.replace(/\s+/g, " ").trim() ?? `Offer ${index + 1}`;

  const categorySource =
    shortDescription && shortDescription.toLowerCase() !== discount.toLowerCase()
      ? shortDescription
      : title && title.toLowerCase() !== discount.toLowerCase()
        ? title
        : description;

  const category = categorySource
    .replace(/\d+\s*%(\s*off)?/i, "")
    .replace(/^(on|for)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    discount,
    category: category || "Featured product page",
  };
}

export default function OffersSection({ result }: OffersSectionProps) {
  const offers = result?.contexts ?? [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOfferIndex, setActiveOfferIndex] = useState<number | null>(null);

  if (!offers.length) {
    return null;
  }

  const visibleOffers = offers.slice(0, 2);

  return (
    <>
      <section>
        <div className="flex justify-end">
          <div className="flex flex-wrap items-center justify-end gap-3 rounded-[18px] border border-[#d8e3ee] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfe_100%)] p-3 shadow-[0_14px_34px_rgba(13,31,60,0.08)]">
          {visibleOffers.map((offer, index) => {
            const isActive = activeOfferIndex === index;
            const tabContent = getOfferTabContent(offer, index);

            return (
              <button
                key={offer.id ?? index}
                type="button"
                onClick={() => {
                  setActiveOfferIndex(index);
                  setIsModalOpen(true);
                }}
                className={`inline-flex min-h-[64px] min-w-[188px] max-w-[290px] items-center justify-center rounded-[12px] border px-5 py-3 text-center transition-all duration-300 ${
                  isActive
                    ? "border-[#1d2c58] bg-[#1d2c58] text-white shadow-[0_12px_24px_rgba(29,44,88,0.24)]"
                    : "border-[#cfd9e4] bg-white text-[#142242] shadow-[0_8px_18px_rgba(20,34,66,0.08)] hover:border-[#aebfd3] hover:shadow-[0_10px_22px_rgba(20,34,66,0.12)]"
                }`}
              >
                <span className="flex max-w-[28ch] flex-col items-center justify-center">
                  <span className="text-[0.95rem] font-semibold leading-5">
                    {tabContent.discount}
                  </span>
                  <span className={`mt-1 line-clamp-2 text-[0.82rem] leading-4 ${isActive ? "text-white/85" : "text-[#4c607e]"}`}>
                    {tabContent.category}
                  </span>
                </span>
              </button>
            );
          })}

        </div>
        </div>
      </section>

      <OffersCarouselModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        result={result!}
      />
    </>
  );
}
