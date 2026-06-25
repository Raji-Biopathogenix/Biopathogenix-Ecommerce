"use client";

import { forwardRef, useImperativeHandle } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

export interface StripeCardInputRef {
  createSetupPaymentMethod: (params: {
    clientSecret: string;
    cardHolderName: string;
    country?: string;
    postalCode?: string;
  }) => Promise<{ paymentMethodId: string }>;
  confirmCheckoutPayment: (params: {
    clientSecret: string;
    cardHolderName: string;
    country?: string;
    postalCode?: string;
    paymentMethodId?: string;
  }) => Promise<{ paymentIntentId: string; paymentMethodId: string | null }>;
}

interface StripeCardInputProps {
  onChange?: (complete: boolean, error?: string) => void;
  cardHolder: string;
  onCardHolderChange: (value: string) => void;
  className?: string;
}

const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      "::placeholder": { color: "#aab7c4" },
    },
    invalid: { color: "#ef4444", iconColor: "#ef4444" },
  },
};

const StripeCardInput = forwardRef<StripeCardInputRef, StripeCardInputProps>(
  ({ onChange, cardHolder, onCardHolderChange, className }, ref) => {
    const stripe = useStripe();
    const elements = useElements();

    useImperativeHandle(ref, () => ({
      async createSetupPaymentMethod({ clientSecret, cardHolderName, country, postalCode }) {
        if (!stripe || !elements) throw new Error("Stripe not loaded");

        const cardNumberElement = elements.getElement(CardNumberElement);
        if (!cardNumberElement) throw new Error("Card element not found");

        const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
          payment_method: {
            card: cardNumberElement,
            billing_details: {
              name: cardHolderName,
              address: {
                country: country || undefined,
                postal_code: postalCode || undefined,
              },
            },
          },
        });

        if (error) throw new Error(error.message || "Card validation failed");

        const paymentMethod = setupIntent?.payment_method;
        const paymentMethodId =
          typeof paymentMethod === "string" ? paymentMethod : paymentMethod?.id;

        if (!paymentMethodId) {
          throw new Error("Payment method was not created.");
        }

        return { paymentMethodId };
      },

      async confirmCheckoutPayment({ clientSecret, cardHolderName, country, postalCode, paymentMethodId }) {
        if (!stripe || !elements) throw new Error("Stripe not loaded");

        const billingDetails = {
          name: cardHolderName,
          address: {
            country: country || undefined,
            postal_code: postalCode || undefined,
          },
        };

        let confirmation;
        if (paymentMethodId) {
          confirmation = await stripe.confirmCardPayment(clientSecret, {
            payment_method: paymentMethodId,
          });
        } else {
          const cardNumberElement = elements.getElement(CardNumberElement);
          if (!cardNumberElement) throw new Error("Card element not found");

          confirmation = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardNumberElement,
              billing_details: billingDetails,
            },
          });
        }

        if (confirmation.error) {
          throw new Error(confirmation.error.message || "Card payment failed");
        }

        const paymentIntentId = confirmation.paymentIntent?.id;
        const confirmedPaymentMethod = confirmation.paymentIntent?.payment_method;
        const confirmedPaymentMethodId =
          typeof confirmedPaymentMethod === "string"
            ? confirmedPaymentMethod
            : confirmedPaymentMethod?.id || null;

        if (!paymentIntentId) {
          throw new Error("Stripe payment was not completed.");
        }

        return {
          paymentIntentId,
          paymentMethodId: confirmedPaymentMethodId,
        };
      },
    }));

    return (
      <div className={className ? `${className} space-y-3` : "space-y-3"}>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Cardholder Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Name on card"
            value={cardHolder}
            onChange={(e) => onCardHolderChange(e.target.value)}
            className="w-full rounded-md border-2 border-gray-300 bg-white p-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Card Number <span className="text-red-500">*</span>
          </label>
          <div className="w-full rounded-md border-2 border-gray-300 bg-white p-3 focus-within:border-blue-500">
            <CardNumberElement
              options={{
                ...ELEMENT_OPTIONS,
                showIcon: true,
              }}
              onChange={(e) => onChange?.(e.complete, e.error?.message)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Expiration Date <span className="text-red-500">*</span>
            </label>
            <div className="w-full rounded-md border-2 border-gray-300 bg-white p-3 focus-within:border-blue-500">
              <CardExpiryElement options={ELEMENT_OPTIONS} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              CVV <span className="text-red-500">*</span>
            </label>
            <div className="w-full rounded-md border-2 border-gray-300 bg-white p-3 focus-within:border-blue-500">
              <CardCvcElement options={ELEMENT_OPTIONS} />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StripeCardInput.displayName = "StripeCardInput";

export default StripeCardInput;
