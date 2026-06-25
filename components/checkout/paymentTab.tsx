import { RefObject } from "react";

import { State, Country } from "@/types";
import SavedAddressSelect from "@/components/address/SavedAddressSelect";
import { AddressErrors, CheckoutPayload } from "@/types/checkout";
import { PaymentIcons } from "@/components/app_icons/app_icons";
import StripeCardInput, { StripeCardInputRef } from "@/components/checkout/StripeCardInput";
import { SavedAddress } from "@/services/addressServices";
import { SavedPaymentMethod } from "@/services/paymentMethodServices";

interface PaymentTabProps {
  form: CheckoutPayload;
  useSameAddress: boolean;
  loading: boolean;
  isLoggedIn: boolean;
  billingErrors: AddressErrors;
  states: State[];
  countries: Country[];
  shippingCost: number;
  formatCurrency: (value: number | string) => string;
  setUseSameAddress: (value: boolean) => void;
  handleSubmit: (event: React.FormEvent) => void | Promise<void>;
  goBackToInformation: () => void;
  goBackToShipping: () => void;
  handleFormChange: (
    field: keyof Omit<CheckoutPayload, "shipping" | "billing">,
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBillingChange: (
    field: keyof CheckoutPayload["billing"],
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  stripeCardRef: RefObject<StripeCardInputRef | null>;
  stripeCardHolder: string;
  setStripeCardHolder: (value: string) => void;
  onStripeCardChange: (complete: boolean, error?: string) => void;
  savedPaymentMethods: SavedPaymentMethod[];
  paymentMethodsLoading: boolean;
  paymentMethodsError: string | null;
  selectedSavedPaymentMethodId: string;
  setSelectedSavedPaymentMethodId: (value: string) => void;
  savePaymentMethod: boolean;
  setSavePaymentMethod: (value: boolean) => void;
  savedBillingAddresses: SavedAddress[];
  selectedSavedBillingAddressId: string;
  setSelectedSavedBillingAddressId: (value: string) => void;
  onFillBilling: (address: SavedAddress) => void;
  saveBillingAddress: boolean;
  setSaveBillingAddress: (value: boolean) => void;
}

function formatBrand(brand: string) {
  if (!brand) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export default function PaymentTab({
  form,
  useSameAddress,
  loading,
  isLoggedIn,
  billingErrors,
  states,
  countries,
  shippingCost,
  formatCurrency,
  setUseSameAddress,
  handleSubmit,
  goBackToInformation,
  goBackToShipping,
  handleFormChange,
  handleBillingChange,
  stripeCardRef,
  stripeCardHolder,
  setStripeCardHolder,
  onStripeCardChange,
  savedPaymentMethods,
  paymentMethodsLoading,
  paymentMethodsError,
  selectedSavedPaymentMethodId,
  setSelectedSavedPaymentMethodId,
  savePaymentMethod,
  setSavePaymentMethod,
  savedBillingAddresses,
  selectedSavedBillingAddressId,
  setSelectedSavedBillingAddressId,
  onFillBilling,
  saveBillingAddress,
  setSaveBillingAddress,
}: PaymentTabProps) {
  const useSavedCard = Boolean(selectedSavedPaymentMethodId);

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Contact</p>
            <p className="text-sm text-[#0b2e59]">{form.shipping.email}</p>
          </div>
          <button type="button" onClick={goBackToInformation} className="text-blue-600 hover:underline text-sm">Change</button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Ship to</p>
            <p className="text-sm text-[#0b2e59]">
              {form.shipping.address_line1} {form.shipping.city} {form.shipping.state_name || form.shipping.state_code || ""} {form.shipping.postal_code}
            </p>
          </div>
          <button type="button" onClick={goBackToInformation} className="text-blue-600 hover:underline text-sm">Change</button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Method</p>
            <p className="text-sm text-[#0b2e59]">UPS - ${formatCurrency(shippingCost)}</p>
          </div>
          <button type="button" onClick={goBackToShipping} className="text-blue-600 hover:underline text-sm">Change</button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#0b2e59] mb-4">Billing details</h2>
        <div className="border border-[#d5deea] rounded-lg overflow-hidden bg-[#f4f7fb]">
          <label className="flex items-center gap-3 cursor-pointer px-4 py-3 border-b border-[#d5deea] bg-[#eef3f9]">
            <input
              type="radio"
              name="billing_address"
              checked={useSameAddress}
              onChange={() => setUseSameAddress(true)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-[#0b2e59]">Same as shipping address</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer px-4 py-3 border-b border-[#d5deea] bg-[#eef3f9]">
            <input
              type="radio"
              name="billing_address"
              checked={!useSameAddress}
              onChange={() => setUseSameAddress(false)}
              className="w-4 h-4"
            />
            <span className="text-sm font-semibold text-[#0b2e59]">Use a different billing address</span>
          </label>

          {!useSameAddress && (
            <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#f4f7fb]">
              <div className="md:col-span-2">
                <SavedAddressSelect
                  label="Use a saved billing address"
                  addresses={savedBillingAddresses}
                  value={selectedSavedBillingAddressId}
                  onChange={(value) => {
                    setSelectedSavedBillingAddressId(value);
                    const id = Number(value);
                    if (!id) return;
                    const address = savedBillingAddresses.find((saved) => saved.id === id);
                    if (address) onFillBilling(address);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input className="w-full border border-[#d5deea] bg-white p-3 rounded" value={form.billing.first_name} onChange={handleBillingChange("first_name")} placeholder="First name" />
                {billingErrors.first_name && <p className="text-xs text-red-600 mt-1">{billingErrors.first_name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input className="w-full border border-[#d5deea] bg-white p-3 rounded" value={form.billing.last_name} onChange={handleBillingChange("last_name")} placeholder="Last name" />
                {billingErrors.last_name && <p className="text-xs text-red-600 mt-1">{billingErrors.last_name}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input className="w-full border border-[#d5deea] bg-white p-3 rounded" value={form.billing.address_line1} onChange={handleBillingChange("address_line1")} placeholder="House number and street name" />
                {billingErrors.address_line1 && <p className="text-xs text-red-600 mt-1">{billingErrors.address_line1}</p>}
              </div>

              <div className="md:col-span-2">
                <input className="w-full border border-[#d5deea] bg-white p-3 rounded" value={form.billing.address_line2} onChange={handleBillingChange("address_line2")} placeholder="Apartment, suite, unit, etc. (optional)" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                  Town / City <span className="text-red-500">*</span>
                </label>
                <input className="w-full border border-[#d5deea] bg-white p-3 rounded" value={form.billing.city} onChange={handleBillingChange("city")} placeholder="City" />
                {billingErrors.city && <p className="text-xs text-red-600 mt-1">{billingErrors.city}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input className="w-full border border-[#d5deea] bg-white p-3 rounded" value={form.billing.postal_code} onChange={handleBillingChange("postal_code")} placeholder="ZIP" />
                {billingErrors.postal_code && <p className="text-xs text-red-600 mt-1">{billingErrors.postal_code}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <select className="w-full border border-[#d5deea] bg-white p-3 rounded" value={form.billing.state} onChange={handleBillingChange("state")}>
                  <option value="">Select state</option>
                  {states?.map((item) => (
                    <option value={item.id} key={item.id}>{item.name}</option>
                  ))}
                </select>
                {billingErrors.state && <p className="text-xs text-red-600 mt-1">{billingErrors.state}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                  Country / Region <span className="text-red-500">*</span>
                </label>
                <select className="w-full border border-[#d5deea] bg-white p-3 rounded" value={form.billing.country} onChange={handleBillingChange("country")}>
                  <option value="">Select country</option>
                  {countries?.map((item) => (
                    <option value={item.id} key={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>

              <label className="md:col-span-2 flex items-center gap-3 text-sm text-[#0b2e59]">
                <input
                  type="checkbox"
                  checked={saveBillingAddress}
                  onChange={(event) => setSaveBillingAddress(event.target.checked)}
                  className="h-4 w-4"
                />
                Save this billing address for future use
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#0b2e59] mb-2">Payment</h2>
        <p className="text-xs text-gray-500 mb-4">All transactions are secure and encrypted.</p>

        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-3 bg-gray-50 border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400">
            <input type="radio" name="payment_method" value="card" checked={form.payment_method === "card"} onChange={handleFormChange("payment_method")} className="w-5 h-5" />
            <div className="flex-1">
              <span className="font-bold text-[#0b2e59] text-base">Card</span>
            </div>
            <PaymentIcons className="flex items-center gap-2" iconClassName="text-2xl" />
          </label>

          {form.payment_method === "card" && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 space-y-4">
              {paymentMethodsLoading ? (
                <div className="rounded border border-[#E6EEF5] bg-white px-4 py-3 text-sm text-[#0B3C5D]">
                  Loading saved payment methods...
                </div>
              ) : savedPaymentMethods.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[#0b2e59]">Use a saved card</p>
                  {savedPaymentMethods.map((method) => (
                    <label key={method.id} className="flex cursor-pointer items-start gap-3 rounded border border-[#d5deea] bg-white px-4 py-3">
                      <input
                        type="radio"
                        name="saved_payment_method"
                        checked={selectedSavedPaymentMethodId === method.id}
                        onChange={() => setSelectedSavedPaymentMethodId(method.id)}
                        className="mt-1 h-4 w-4"
                      />
                      <div className="text-sm text-[#0b2e59]">
                        <div className="font-semibold">
                          {formatBrand(method.brand)} ending in {method.last4}
                        </div>
                        <div className="text-gray-500">
                          Expires {String(method.exp_month ?? "").padStart(2, "0")}/{method.exp_year ?? ""}
                        </div>
                      </div>
                    </label>
                  ))}

                  <label className="flex cursor-pointer items-start gap-3 rounded border border-[#d5deea] bg-white px-4 py-3">
                    <input
                      type="radio"
                      name="saved_payment_method"
                      checked={!selectedSavedPaymentMethodId}
                      onChange={() => setSelectedSavedPaymentMethodId("")}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="text-sm font-semibold text-[#0b2e59]">Use a new card</div>
                  </label>
                </div>
              ) : null}

              {paymentMethodsError && (
                <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {paymentMethodsError}
                </div>
              )}

              <div className={useSavedCard ? "hidden" : "space-y-4 rounded border border-[#d5deea] bg-white p-4"}>
                <StripeCardInput
                  ref={stripeCardRef}
                  cardHolder={stripeCardHolder}
                  onCardHolderChange={setStripeCardHolder}
                  onChange={onStripeCardChange}
                />

                <label className="flex items-center gap-3 text-sm text-[#0b2e59]">
                  <input
                    type="checkbox"
                    checked={savePaymentMethod}
                    onChange={(event) => setSavePaymentMethod(event.target.checked)}
                    className="h-4 w-4"
                  />
                  Save this card for future payments
                </label>
              </div>
            </div>
          )}

          <label className="flex items-center gap-3 bg-gray-50 border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400">
            <input type="radio" name="payment_method" value="invoice" checked={form.payment_method === "invoice"} onChange={handleFormChange("payment_method")} className="w-5 h-5" />
            <div className="flex-1">
              <span className="font-bold text-[#0b2e59] text-base">Invoice</span>
            </div>
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </label>

          {form.payment_method === "invoice" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-900">
                  <strong className="block mb-2">How Invoice Payment Works:</strong>
                  <ul className="space-y-1.5 text-xs leading-relaxed">
                    <li>* Click &quot;Place Order&quot; to submit your order request</li>
                    <li>* You&apos;ll receive an order confirmation email immediately</li>
                    <li>* We&apos;ll send a detailed invoice within 24 hours</li>
                    <li>* Payment methods: Bank transfer, check, or wire</li>
                    <li>* Payment due within invoice terms (typically Net 30)</li>
                    <li>* Shipping: $20 per product</li>
                    <li>* Tax calculated based on your location</li>
                    <li>* Your order ships once payment is confirmed</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-6">
        Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
      </p>

      <div className="flex justify-between items-center">
        <button type="button" onClick={goBackToShipping} className="text-blue-600 hover:underline text-sm">&lt;- Return to shipping</button>
        <button
          type="submit"
          className="bg-[#0b2e59] hover:bg-[#0a2547] text-white px-8 py-3 rounded text-sm font-medium disabled:opacity-50"
          disabled={loading || !isLoggedIn}
        >
          {loading ? "Placing order..." : "Place order"}
        </button>
      </div>
    </form>
  );
}
