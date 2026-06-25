import { SavedAddress } from "@/services/addressServices";

interface SavedAddressSelectProps {
  label: string;
  addresses: SavedAddress[];
  value: string;
  onChange: (value: string) => void;
}

export default function SavedAddressSelect({
  label,
  addresses,
  value,
  onChange,
}: SavedAddressSelectProps) {
  if (!addresses.length) return null;

  return (
    <div className="mb-4">
      <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">
        {label}
      </label>
      <select
        className="w-full border p-3 rounded text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Enter a new address</option>
        {addresses.map((address) => (
          <option key={address.id} value={String(address.id)}>
            {address.first_name} {address.last_name} - {address.address_line1}, {address.city}, {address.state_name} {address.postal_code}
          </option>
        ))}
      </select>
    </div>
  );
}
