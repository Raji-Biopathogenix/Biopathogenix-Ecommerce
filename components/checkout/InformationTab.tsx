import SavedAddressSelect from "@/components/address/SavedAddressSelect";
import { SavedAddress } from "@/services/addressServices";
import { State, Country } from "@/types";
import { CheckoutErrors, CheckoutPayload } from "@/types/checkout";

interface InformationTabProps {
  shipping: CheckoutPayload["shipping"];
  billing: CheckoutPayload["billing"];
  onShippingChange: (field: keyof CheckoutPayload["shipping"]) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBillingChange: (field: keyof CheckoutPayload["billing"]) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  companyName: string;
  setCompanyName: (value: string) => void;
  userType: string;
  setUserType: (value: string) => void;
  states: State[];
  countries: Country[];
  errors: CheckoutErrors;
  savedShippingAddresses?: SavedAddress[];
  onFillShipping?: (address: SavedAddress) => void;
  selectedSavedShippingAddressId?: string;
  onSelectSavedShippingAddress?: (value: string) => void;
  saveShippingAddress?: boolean;
  onSaveShippingAddressChange?: (value: boolean) => void;
}

export default function InformationTab({
  shipping,
  onShippingChange,
  companyName,
  setCompanyName,
  userType,
  setUserType,
  states,
  countries,
  errors,
  savedShippingAddresses = [],
  onFillShipping,
  selectedSavedShippingAddressId = "",
  onSelectSavedShippingAddress,
  saveShippingAddress = false,
  onSaveShippingAddressChange,
}: InformationTabProps) {
  return (
    <>
      {savedShippingAddresses.length > 0 && onFillShipping && (
        <SavedAddressSelect
          label="Use a saved shipping address"
          addresses={savedShippingAddresses}
          value={selectedSavedShippingAddressId}
          onChange={(value) => {
            onSelectSavedShippingAddress?.(value);
            const id = Number(value);
            if (!id) return;
            const address = savedShippingAddresses.find((saved) => saved.id === id);
            if (address) onFillShipping(address);
          }}
        />
      )}

      <div>
        <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">
          Email address <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full border p-3 rounded"
          placeholder="Email address"
          type="email"
          value={shipping.email}
          onChange={onShippingChange("email")}
          required
        />
        {errors.shipping.email && (
          <p className="text-red-500 text-xs mt-1">{errors.shipping.email}</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#0b2e59] mb-4">Shipping address</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">
              First name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border p-3 rounded"
              value={shipping.first_name}
              onChange={onShippingChange("first_name")}
              required
            />
            {errors.shipping.first_name && (
              <p className="text-red-500 text-xs mt-1">{errors.shipping.first_name}</p>
            )}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">
              Last name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border p-3 rounded"
              value={shipping.last_name}
              onChange={onShippingChange("last_name")}
              required
            />
            {errors.shipping.last_name && (
              <p className="text-red-500 text-xs mt-1">{errors.shipping.last_name}</p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">
            Company name
          </label>
          <input
            className="w-full border p-3 rounded"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">
            Street address <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border p-3 rounded"
            placeholder="House number and street name"
            value={shipping.address_line1}
            onChange={onShippingChange("address_line1")}
            required
          />
        </div>

        <div className="mb-4">
          <input
            className="w-full border p-3 rounded"
            placeholder="Apartment, suite, unit, etc. (optional)"
            value={shipping.address_line2}
            onChange={onShippingChange("address_line2")}
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">Country</label>
          <select
            className="w-full border p-3 rounded"
            value={shipping.country}
            onChange={onShippingChange("country")}
            required
          >
            <option value="">Select country</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">
              Town / City <span className="text-red-500">*</span>
            </label>
            <input className="w-full border p-3 rounded" value={shipping.city} onChange={onShippingChange("city")} required />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <select className="w-full border p-3 rounded" value={shipping.state} onChange={onShippingChange("state")} required>
              <option value="">Select state</option>
              {states.map((savedState) => (
                <option key={savedState.id} value={savedState.id}>
                  {savedState.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">
            Zip code <span className="text-red-500">*</span>
          </label>
          <input className="w-full border p-3 rounded" value={shipping.postal_code} onChange={onShippingChange("postal_code")} required />
        </div>

        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">Phone (optional)</label>
          <input className="w-full border p-3 rounded" type="tel" value={shipping.phone} onChange={onShippingChange("phone")} />
        </div>

        {onSaveShippingAddressChange && (
          <label className="mb-4 flex items-center gap-3 text-sm text-[#0b2e59]">
            <input
              type="checkbox"
              checked={saveShippingAddress}
              onChange={(e) => onSaveShippingAddressChange(e.target.checked)}
              className="h-4 w-4"
            />
            Save this shipping address for future use
          </label>
        )}

        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">User Type</label>
          <select className="w-full border p-3 rounded" value={userType} onChange={(e) => setUserType(e.target.value)}>
            <option value="Laboratory (manually reviewed)">Laboratory (manually reviewed)</option>
            <option value="Student/Academic">Student/Academic</option>
            <option value="Hospital/Clinical">Hospital/Clinical</option>
            <option value="Pharmaceutical">Pharmaceutical</option>
            <option value="Biotechnology">Biotechnology</option>
            <option value="Government">Government</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
    </>
  );
}
