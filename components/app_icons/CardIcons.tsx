import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { FaCcAmex, FaCcDiscover, FaCcMastercard, FaCcVisa, FaRegCreditCard } from "react-icons/fa";

export type CardType = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export const VisaIcon = FaCcVisa;
export const MasterCardIcon = FaCcMastercard;
export const AmexIcon = FaCcAmex;
export const DiscoverIcon = FaCcDiscover;
export const DefaultCardIcon = FaRegCreditCard;

export function detectCardType(cardNumber: string): CardType {
  const num = cardNumber.replace(/\D/g, "");
  if (/^4/.test(num)) return "visa";
  if (/^5[1-5]/.test(num) || /^2(2[2-9]|[3-6][0-9]|7[01]|720)/.test(num)) return "mastercard";
  if (/^3[47]/.test(num)) return "amex";
  if (/^6(?:011|5|4[4-9])/.test(num)) return "discover";
  return "unknown";
}

export function getCardBrandIconComponent(cardType: CardType): IconType {
  switch (cardType) {
    case "visa":
      return VisaIcon;
    case "mastercard":
      return MasterCardIcon;
    case "amex":
      return AmexIcon;
    case "discover":
      return DiscoverIcon;
    default:
      return DefaultCardIcon;
  }
}

export function getCardBrandIconElement(cardType: CardType): ReactNode {
  const Icon = getCardBrandIconComponent(cardType);
  return <Icon />;
}

export function getCardBrandColorClass(cardType: CardType): string {
  switch (cardType) {
    case "visa":
      return "text-[#1a1f71]";
    case "mastercard":
      return "text-[#eb001b]";
    case "amex":
      return "text-[#2e77bb]";
    case "discover":
      return "text-[#ff6000]";
    default:
      return "text-slate-500";
  }
}

interface PaymentIconsProps {
  className?: string;
  iconClassName?: string;
}

export const PaymentIcons = ({ className = "flex items-center gap-2", iconClassName = "text-2xl" }: PaymentIconsProps) => (
  <div className={className} aria-label="Supported cards">
    <span className={`${iconClassName} text-[#1a1f71]`} title="Visa">
      <VisaIcon />
    </span>
    <span className={`${iconClassName} text-[#eb001b]`} title="Mastercard">
      <MasterCardIcon />
    </span>
    <span className={`${iconClassName} text-[#2e77bb]`} title="American Express">
      <AmexIcon />
    </span>
    <span className={`${iconClassName} text-[#ff6000]`} title="Discover">
      <DiscoverIcon />
    </span>
  </div>
);
