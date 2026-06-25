"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AddressServices, SavedAddress } from "@/services/addressServices";

function AddressCard({
  address,
  onDelete,
}: {
  address: SavedAddress;
  onDelete: (id: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this address?")) return;
    setDeleting(true);
    try {
      await AddressServices.remove(address.id);
      onDelete(address.id);
    } finally {
      setDeleting(false);
    }
  }

  const editHref =
    address.shipping_type === "billing_addr"
      ? `/my-account/edit-address/billing?id=${address.id}`
      : `/my-account/edit-address/shipping?id=${address.id}`;

  return (
    <div className="rounded border border-[#E6EEF5] bg-white px-6 py-5 space-y-1">
      <p className="text-sm font-semibold text-[#0B3C5D]">
        {address.first_name} {address.last_name}
      </p>
      {address.email && <p className="text-sm text-gray-600">{address.email}</p>}
      <p className="text-sm text-gray-600">{address.address_line1}</p>
      {address.address_line2 && (
        <p className="text-sm text-gray-600">{address.address_line2}</p>
      )}
      <p className="text-sm text-gray-600">
        {address.city}, {address.state_name} {address.postal_code}
      </p>
      <p className="text-sm text-gray-600">{address.country_name}</p>
      <div className="flex gap-4 pt-3">
        <Link
          href={editHref}
          className="text-xs font-semibold uppercase tracking-wide text-[#1185C8] hover:underline"
        >
          Edit
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-semibold uppercase tracking-wide text-red-500 hover:underline disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

export default function EditAddressPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AddressServices.list()
      .then((res) => setAddresses(res?.result?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleDelete(id: number) {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  const shipping = addresses.filter((a) => a.shipping_type === "shipping_addr");
  const billing = addresses.filter((a) => a.shipping_type === "billing_addr");

  return (
    <div className="text-[#0B3C5D] space-y-12">
      <p className="text-sm">
        The following addresses will be used on the checkout page by default.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading addresses…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
          {/* Billing */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Billing addresses</h2>
            <div className="space-y-4">
              {billing.length === 0 ? (
                <p className="italic text-sm text-gray-500">
                  No billing address saved yet.
                </p>
              ) : (
                billing.map((a) => (
                  <AddressCard key={a.id} address={a} onDelete={handleDelete} />
                ))
              )}
            </div>
            <Link
              href="/my-account/edit-address/billing"
              className="inline-block mt-5 rounded bg-[#E5EDF4] px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#0B3C5D] transition hover:bg-[#D7E6F2]"
            >
              Add Billing Address
            </Link>
          </div>

          {/* Shipping */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Shipping addresses</h2>
            <div className="space-y-4">
              {shipping.length === 0 ? (
                <p className="italic text-sm text-gray-500">
                  No shipping address saved yet.
                </p>
              ) : (
                shipping.map((a) => (
                  <AddressCard key={a.id} address={a} onDelete={handleDelete} />
                ))
              )}
            </div>
            <Link
              href="/my-account/edit-address/shipping"
              className="inline-block mt-5 rounded bg-[#E5EDF4] px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#0B3C5D] transition hover:bg-[#D7E6F2]"
            >
              Add Shipping Address
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
