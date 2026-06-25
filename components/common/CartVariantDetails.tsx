"use client";

import { CartVariantOption } from "@/types/cart";

interface CartVariantDetailsProps {
  variantOptions?: CartVariantOption[];
  className?: string;
}

export default function CartVariantDetails({
  variantOptions,
  className = "",
}: CartVariantDetailsProps) {
  if (!variantOptions || !variantOptions.length) {
    return null;
  }

  return (
    <div className={`space-y-1 text-[0.65rem] text-[#1b3b5d] leading-tight ${className}`}>
      {variantOptions.map((option) => {
        const key = option.variant_option_id
          ? `variant-${option.variant_option_id}`
          : `${option.variant_name}-${option.variant_value}`;

        return (
          <p key={key} className="text-[0.75rem]">
            <span className="font-semibold uppercase tracking-[0.16em] text-[#0b2e59]">
              {option.variant_name || "Option"}:
            </span>{" "}
            <span className="font-normal normal-case text-[#4b5563]">
              {option.variant_value}
            </span>
          </p>
        );
      })}
    </div>
  );
}
