import { loadStripe } from '@stripe/stripe-js';
import { API_BASE_URL } from "@/config/env";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();

async function getStripePublishableKey() {
  if (stripePublishableKey) {
    return stripePublishableKey;
  }

  const response = await fetch(`${API_BASE_URL}/v1/payment-methods/stripe-config/`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load Stripe configuration.");
  }

  const payload = await response.json();
  const key = payload?.result?.data?.publishable_key?.trim?.() || "";
  if (!key) {
    throw new Error("Stripe publishable key is missing.");
  }

  return key;
}

export const stripePromise = getStripePublishableKey().then((key) => loadStripe(key));
