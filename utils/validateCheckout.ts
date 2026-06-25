
import {AddressFields,CheckoutPayload,AddressErrors,CheckoutErrors} from '@/types/checkout';


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-()]{7,15}$/;
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

export function validateAddress(address: AddressFields, label: "shipping" | "billing"): AddressErrors {
    const errors: AddressErrors = {};

    if (!address.first_name.trim())
        errors.first_name = `${label} first name is required`;

    if (!address.last_name.trim())
        errors.last_name = `${label} last name is required`;

    if (!address.email.trim())
        errors.email = `${label} email is required`;
    else if (!EMAIL_REGEX.test(address.email))
        errors.email = "Enter a valid email address";

    if (address.phone && !PHONE_REGEX.test(address.phone))
        errors.phone = "Enter a valid phone number";

    if (!address.address_line1.trim())
        errors.address_line1 = "Street address is required";

    if (!address.city.trim())
        errors.city = "City is required";

    if (!address.state)
        errors.state = "State is required";

    if (!address.postal_code.trim())
        errors.postal_code = "Zip code is required";
    else if (!ZIP_REGEX.test(address.postal_code))
        errors.postal_code = "Enter a valid zip code (e.g. 12345)";

    return errors;
}

export function validateCheckout(form: CheckoutPayload): CheckoutErrors {
    const errors: CheckoutErrors = {
        shipping: validateAddress(form.shipping, "shipping"),
        billing: form.useSameAddress
            ? {}  // skip billing if same as shipping
            : validateAddress(form.billing, "billing"),
    };
    return errors;
}

export function hasErrors(errors: CheckoutErrors): boolean {
    return (
        Object.keys(errors.shipping).length > 0 ||
        Object.keys(errors.billing).length > 0
    );
}


