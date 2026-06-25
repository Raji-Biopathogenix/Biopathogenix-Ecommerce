import { CheckoutPayload } from "@/types/checkout"; // adjust import path
import { State, Country  } from '@/types';

interface ShippingTabProps {
    shipping: CheckoutPayload["shipping"];
    billing: CheckoutPayload["billing"];
    onShippingChange: (field: keyof CheckoutPayload["shipping"]) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onBillingChange: (field: keyof CheckoutPayload["billing"]) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    companyName: string;
    setCompanyName: (v: string) => void;
    userType: string;
    setUserType: (v: string) => void;
    states:State[],
    countries:Country[],
    goBackToInformation:()=>void,
    goToPayment:()=>void,
    formatCurrency:(value: number | string) => number|string ;

    shippingCost:number,
    customer_notes:string,
    handleFormChange:(field: keyof Omit<CheckoutPayload, "shipping" | "billing">) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;

}


export default function ShippingTab({
    onShippingChange,
    companyName,
    setCompanyName,
    userType,
    setUserType,
    states,
    countries,shipping,goBackToInformation,formatCurrency,shippingCost,goToPayment,customer_notes,handleFormChange}:ShippingTabProps){


    return(<>

     
        {/* Contact Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
            <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Contact</p>
                <p className="text-sm text-[#0b2e59]">{shipping?.email}</p>
            </div>
            <button type="button" onClick={goBackToInformation} className="text-blue-600 hover:underline text-sm">Change</button>
            </div>
        </div>

        {/* Ship To Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
            <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Ship to</p>
                <p className="text-sm text-[#0b2e59]">
                {shipping?.address_line1},{shipping?.city}, {shipping?.state_name || shipping?.state_code || ""}  {shipping?.postal_code}
                </p>
            </div>
            <button type="button" onClick={goBackToInformation} className="text-blue-600 hover:underline text-sm">Change</button>
            </div>
        </div>

        <div>
            <h2 className="text-lg font-semibold text-[#0b2e59] mb-4">Shipping Method</h2>
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 cursor-not-allowed opacity-80">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#0b2e59]">UPS Ground</span>
                <span className="text-xs text-gray-500">(Calculated automatically)</span>
                </div>
                <span className="text-sm font-semibold">${formatCurrency(shippingCost)}</span>
            </div>
            {shippingCost > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                Based on number of products in your order
                </p>
            )}
            </div>
        </div>

        <div>
            <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">Order notes (optional)</label>
            <textarea 
            className="w-full border p-3 rounded" 
            rows={4} 
            placeholder="Notes about your order, e.g. special notes for delivery."
            value={customer_notes}
            onChange={handleFormChange("customer_notes")}
            />
        </div>

        <div className="flex justify-between items-center">
            <button type="button" onClick={goBackToInformation} className="text-blue-600 hover:underline text-sm">← Return to information</button>
            <button 
            type="button" 
            onClick={goToPayment} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded text-sm font-medium"
            >
            Continue to payment
            </button>
        </div>

    </>)
}
