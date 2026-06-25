import { AddressPayload, SavedAddress } from "@/services/addressServices";
import { AddressFields } from "@/types/checkout";

export const mapSavedAddressToAddressFields = (
  address: SavedAddress,
  fallbackEmail = "",
): AddressFields => ({
  first_name: address.first_name,
  last_name: address.last_name,
  email: address.email || fallbackEmail,
  phone: address.phone || "",
  address_line1: address.address_line1,
  address_line2: address.address_line2 || "",
  city: address.city,
  state: String(address.state),
  postal_code: address.postal_code,
  country: String(address.country),
  state_code: address.state_code || "",
  country_code: address.country_code || "",
  state_name: address.state_name || "",
  country_name: address.country_name || "",
});

export const buildAddressPayload = (
  address: AddressFields,
  shippingType: AddressPayload["shipping_type"],
): AddressPayload => ({
  first_name: address.first_name,
  last_name: address.last_name,
  email: address.email,
  phone: address.phone,
  address_line1: address.address_line1,
  address_line2: address.address_line2,
  city: address.city,
  state: Number(address.state),
  country: Number(address.country),
  postal_code: address.postal_code,
  shipping_type: shippingType,
});

export const addressesMatch = (address: AddressFields, saved: SavedAddress) =>
  address.first_name.trim() === saved.first_name &&
  address.last_name.trim() === saved.last_name &&
  address.email.trim() === saved.email &&
  address.phone.trim() === saved.phone &&
  address.address_line1.trim() === saved.address_line1 &&
  address.address_line2.trim() === (saved.address_line2 || "") &&
  address.city.trim() === saved.city &&
  String(address.state) === String(saved.state) &&
  String(address.country) === String(saved.country) &&
  address.postal_code.trim() === saved.postal_code;
