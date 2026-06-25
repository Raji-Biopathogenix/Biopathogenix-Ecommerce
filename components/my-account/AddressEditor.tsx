"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AddressPayload, AddressServices, SavedAddress } from "@/services/addressServices";
import { stateService } from "@/services/stateService";

interface FormState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

const EMPTY: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  country: "",
  postal_code: "",
};

interface AddressEditorProps {
  title: string;
  shippingType: AddressPayload["shipping_type"];
}

export default function AddressEditor({ title, shippingType }: AddressEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [states, setStates] = useState<{ id: number; name: string }[]>([]);
  const [countries, setCountries] = useState<{ id: number; name: string; code?: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [statesRes, countriesRes] = await Promise.all([
          stateService.getAllStates(),
          stateService.getAllCountries(),
        ]);
        const stateList = statesRes?.result?.data ?? [];
        const countryList = countriesRes?.result?.data ?? [];
        setStates(stateList);
        setCountries(countryList);

        const defaultCountry =
          countryList.find((country) => country.code?.toUpperCase() === "US") || countryList[0];

        if (editId) {
          const listRes = await AddressServices.list();
          const address: SavedAddress | undefined = listRes?.result?.data?.find(
            (saved) => String(saved.id) === editId,
          );
          if (address) {
            setForm({
              first_name: address.first_name,
              last_name: address.last_name,
              email: address.email,
              phone: address.phone,
              address_line1: address.address_line1,
              address_line2: address.address_line2,
              city: address.city,
              state: String(address.state),
              country: String(address.country),
              postal_code: address.postal_code,
            });
          }
        } else if (defaultCountry) {
          setForm((prev) => ({ ...prev, country: String(defaultCountry.id) }));
        }
      } catch {
        setError("Failed to load form data.");
      } finally {
        setLoadingData(false);
      }
    }

    init();
  }, [editId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.state || !form.country) {
      setError("Please select a state and country.");
      return;
    }

    setSaving(true);
    try {
      const payload: AddressPayload = {
        ...form,
        state: Number(form.state),
        country: Number(form.country),
        shipping_type: shippingType,
      };

      if (editId) {
        await AddressServices.update(Number(editId), payload);
      } else {
        await AddressServices.create(payload);
      }
      router.push("/my-account/edit-address");
    } catch {
      setError("Failed to save address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="max-w-3xl text-[#0B3C5D]">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl text-[#0B3C5D]">
      <h1 className="text-4xl font-semibold mb-10">{title}</h1>

      {error && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="First name" name="first_name" value={form.first_name} onChange={handleChange} required />
          <Field label="Last name" name="last_name" value={form.last_name} onChange={handleChange} required />
        </div>

        <Field label="Email address" name="email" type="email" value={form.email} onChange={handleChange} required />

        <div>
          <label className="block text-[11px] uppercase tracking-wide mb-1">
            Country / Region <span className="text-red-500">*</span>
          </label>
          <select
            name="country"
            value={form.country}
            onChange={handleChange}
            required
            className="w-full rounded border border-gray-300 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select country</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <Field label="Street address" name="address_line1" value={form.address_line1} onChange={handleChange} required />

        <input
          name="address_line2"
          placeholder="Apartment, suite, unit, etc. (optional)"
          value={form.address_line2}
          onChange={handleChange}
          className="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <Field label="Town / City" name="city" value={form.city} onChange={handleChange} required />

        <div>
          <label className="block text-[11px] uppercase tracking-wide mb-1">
            State <span className="text-red-500">*</span>
          </label>
          <select
            name="state"
            value={form.state}
            onChange={handleChange}
            required
            className="w-full rounded border border-gray-400 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select state</option>
            {states.map((savedState) => (
              <option key={savedState.id} value={savedState.id}>
                {savedState.name}
              </option>
            ))}
          </select>
        </div>

        <Field label="ZIP code" name="postal_code" value={form.postal_code} onChange={handleChange} required />
        <Field label="Phone (optional)" name="phone" type="tel" value={form.phone} onChange={handleChange} />

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-[#0B3C5D] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#0a3050] disabled:opacity-50"
          >
            {saving ? "Saving..." : editId ? "Update address" : "Save address"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/my-account/edit-address")}
            className="rounded bg-[#E5EDF4] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#0B3C5D] transition hover:bg-[#D7E6F2]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wide mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
