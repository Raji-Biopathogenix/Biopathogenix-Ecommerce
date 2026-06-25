"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";

import InformationTab from "@/components/checkout/InformationTab";
import ShippingTab from "@/components/checkout/shippingTab";
import PaymentTab from "@/components/checkout/paymentTab";
import OrderSummary from "@/components/checkout/OrderSummary";
import { StripeCardInputRef } from "@/components/checkout/StripeCardInput";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { stripePromise } from "@/lib/stripe";
import { CartServices } from "@/services/cartServices";
import { CheckoutServices } from "@/services/CheckoutServices";
import { PaymentMethodServices, SavedPaymentMethod } from "@/services/paymentMethodServices";
import { AddressServices, SavedAddress } from "@/services/addressServices";
import { stateService } from "@/services/stateService";
import { TaxServices } from "@/services/taxServices";
import { Country, State } from "@/types";
import { CartItem } from "@/types/cart";
import {
  AddressErrors,
  AddressFields,
  AppError,
  CheckoutErrors,
  CheckoutPayload,
} from "@/types/checkout";
import {
  addressesMatch,
  buildAddressPayload,
  mapSavedAddressToAddressFields,
} from "@/utils/addressHelpers";
import { validateAddress, validateCheckout } from "@/utils/validateCheckout";
import {CouponCalulations} from '@/utils/helperFunction';

const generateIdempotencyKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  return "Something went wrong.";
};

const EMPTY_ADDRESS: AddressFields = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  state_code: "",
  country_code: "",
  state_name: "",
  country_name: "",
};

const INITIAL_FORM: CheckoutPayload = {
  shipping: EMPTY_ADDRESS,
  billing: EMPTY_ADDRESS,
  useSameAddress: true,
  customer_notes: "",
  payment_method: "",
};

const getCheckoutItemStock = (item: CartItem) =>
  Number(item?.product_sku?.stock ?? item?.product_obj?.stock_quantity ?? 0);

const getCheckoutItemFlags = (item: CartItem) => {
  const stock = getCheckoutItemStock(item);

  if (item?.has_variants && !item?.product_sku) {
    return { ...item, removeitem: true };
  }

  if (stock <= 0) {
    return { ...item, removeitem: true };
  }

  if (item?.quantity > stock) {
    return { ...item, low_stock: true };
  }

  return { ...item, low_stock: false, removeitem: false };
};

type Step = "information" | "shipping" | "payment" | "fatal";

export default function CheckoutPage() {
  const router = useRouter();
  const idempotencyKey = useRef(generateIdempotencyKey());
  const stripeCardRef = useRef<StripeCardInputRef>(null);
  const { setShowMainPageLoader, tmpId, user, dispatch,reducerState } = useAuth();
  const { setToastNotification } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>("information");
  const [stepsCaptured, setStepsCaptured] = useState<Step[]>(["information"]);
  const [couponcode, setCouponcode] = useState<string>('')
  const [couponAmount, setCouponAmount] = useState<number>(0)
  const [enableProceedBtn, setEnableProceedBtn] = useState(true)
  const [freeShipping, setFreeShipping] = useState(false)
  const [stripeCardHolder, setStripeCardHolder] = useState("");
  const [isStripeCardComplete, setIsStripeCardComplete] = useState(false);
  const [stripeCardError, setStripeCardError] = useState<string | undefined>();
  const [savedShippingAddresses, setSavedShippingAddresses] = useState<SavedAddress[]>([]);
  const [savedBillingAddresses, setSavedBillingAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedShippingAddressId, setSelectedSavedShippingAddressId] = useState("");
  const [selectedSavedBillingAddressId, setSelectedSavedBillingAddressId] = useState("");
  const [saveShippingAddress, setSaveShippingAddress] = useState(false);
  const [saveBillingAddress, setSaveBillingAddress] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null);
  const [selectedSavedPaymentMethodId, setSelectedSavedPaymentMethodId] = useState("");
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [fatalError, setFatalError] = useState<{
    message: string;
    transaction_id: string | null;
  } | null>(null);

  const [form, setForm] = useState<CheckoutPayload>(INITIAL_FORM);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [userType, setUserType] = useState("Laboratory (manually reviewed)");
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const selectedQuantity = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxQuoteError, setTaxQuoteError] = useState<string | null>(null);



  const [useSameAddress, setUseSameAddress] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [state, setStates] = useState<State[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [errors] = useState<CheckoutErrors>({ shipping: {}, billing: {} });
  const [billingErrors, setBillingErrors] = useState<AddressErrors>({});
  const [hideCheckoutBtn] = useState(false)

  const getCountries = useCallback(async () => {
    setShowMainPageLoader(true);
    try {
      const response = await stateService.getAllCountries();
      const countryList = response?.result?.data ?? [];
      setCountries(countryList);

      if (countryList[0]) {
        const defaultCountry =
          countryList.find((item) => String(item?.code || "").toUpperCase() === "US") || countryList[0];
        setForm((prev) => {
          if (prev.shipping.country) return prev;
          return {
            ...prev,
            shipping: {
              ...prev.shipping,
              country: `${defaultCountry?.id}`,
              country_code: defaultCountry?.code || "",
              country_name: defaultCountry?.name || "",
            },
          };
        });
      }
    } catch (err: unknown) {
      setToastNotification({ type: "error", message: getErrorMessage(err) });
    } finally {
      setShowMainPageLoader(false);
    }
  }, [setShowMainPageLoader, setToastNotification]);

  const getStates = useCallback(async () => {
    setShowMainPageLoader(true);
    try {
      const response = await stateService.getAllStates();
      const stateList = response?.result?.data ?? [];
      setStates(stateList);

      setForm((prev) => {
        const rawState = String(prev.shipping.state || "").trim();
        if (!rawState) return prev;

        const matchedState =
          stateList.find((item) => `${item.id}` === rawState) ||
          stateList.find((item) => String(item?.code || "").toUpperCase() === rawState.toUpperCase()) ||
          stateList.find((item) => String(item?.name || "").toLowerCase() === rawState.toLowerCase());

        if (!matchedState) return prev;

        return {
          ...prev,
          shipping: {
            ...prev.shipping,
            state: `${matchedState.id}`,
            state_code: matchedState.code || "",
            state_name: matchedState.name || "",
          },
        };
      });
    } catch (err: unknown) {
      setToastNotification({ type: "error", message: getErrorMessage(err) });
    } finally {
      setShowMainPageLoader(false);
    }
  }, [setShowMainPageLoader, setToastNotification]);

  const loadCart = useCallback(async () => {
    setShowMainPageLoader(true);
    let naviagateToCart = false
    try {
      const response = await CartServices.getcheckoutItems(tmpId);
      if (response.status === "success") {
        const responseItems = response?.result?.data ?? [];
        if(responseItems?.length === 0){
          router.push('/');
          return;
        }
        const updatedItems = responseItems.map((item) => {
          const flaggedItem = getCheckoutItemFlags(item);
          if (flaggedItem?.low_stock || flaggedItem?.removeitem) {
            naviagateToCart = true;
          }
          return flaggedItem;
        });
        if(naviagateToCart){
          router.push('/cart');
          return;
        }
        setCart(updatedItems);
        getStates();
        getCountries();
    }
    } catch (err: unknown) {
      setToastNotification({ type: "error", message: getErrorMessage(err) });
    } finally {
      setShowMainPageLoader(false);
    }
  }, [getCountries, getStates, router, setShowMainPageLoader, setToastNotification, tmpId]);





  useEffect(() => {
    loadCart();
  }, [tmpId, loadCart]);

  useEffect(() => {
    if(cart?.length > 0){
      const productsFinalPrice = cart.reduce((sum, item) => sum + Number(item.total_price), 0);
      setSubtotal(productsFinalPrice);
      if(cart?.[0]?.coupon_code){
        const couponRes = CouponCalulations(productsFinalPrice,cart?.[0]?.coupon_val, cart?.[0]?.coupon_type)
        if(couponRes){
          setTotal(Number(couponRes?.totalAmt) + Number(taxAmount) + Number(shippingCost))
          setCouponAmount(couponRes?.couponAmt)
        }else{
          setTotal(productsFinalPrice + Number(taxAmount) + Number(shippingCost))
        }
        setCouponcode(cart?.[0]?.coupon_code)
      }else{
        setTotal(Number(productsFinalPrice) + Number(taxAmount) + Number(shippingCost))
      }
    }
  }, [cart,shippingCost,taxAmount]);

  useEffect(() => {
    const zip = (form.shipping.postal_code || "").replace(/\D/g, "").slice(0, 5);
    if (zip.length !== 5) {
      setTaxAmount(0);
      setTaxRate(0);
      setShippingCost(0);
      setTaxQuoteError(null);
      return;
    }

    let cancelled = false;
      const timeout = setTimeout(async () => {
        try {
          const selectedStateCode =
            state.find((item) => `${item.id}` === `${form.shipping.state}`)?.code ||
            form.shipping.state_code ||
            "";
          const selectedCountryCode =
            countries.find((item) => `${item.id}` === `${form.shipping.country}`)?.code ||
            form.shipping.country_code ||
            "";

          if (!selectedStateCode) {
            setTaxAmount(0);
            setTaxRate(0);
            setShippingCost(0);
            setTaxQuoteError("Please select a valid shipping state before calculating tax.");
            window.scrollTo(0, 0);
            return;
          }

          if (!selectedCountryCode) {
            setTaxAmount(0);
            setTaxRate(0);
            setShippingCost(0);
            setTaxQuoteError("Please select a valid shipping country before calculating tax.");
            return;
          }

          if (!subtotal || subtotal <= 0) {
            setTaxAmount(0);
            setTaxRate(0);
            setShippingCost(0);
            setTaxQuoteError(null);
            return;
          }

          const quote = await TaxServices.calculateByZip({
            shipping_city: form.shipping.city || "",
            shipping_address_line1: form.shipping.address_line1 || "",
            shipping_state: selectedStateCode,
            shipping_postal_code: zip,
            shipping_country: selectedCountryCode || "US",
            amount:subtotal,
            item_quantity: selectedQuantity,
          });

        if (cancelled) return;
        if(quote?.status=="success"){
          if(quote?.result?.amount_to_collect){
            setTaxAmount(Number(quote?.result?.amount_to_collect));
          }
          if(quote?.result?.rate){
            setTaxRate(Number(quote?.result?.rate));

          }
        }
        setTaxQuoteError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        setTaxAmount(0);
        setTaxRate(0);
        setShippingCost(0);
        setTaxQuoteError(getErrorMessage(err));
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [
    countries,
    form.shipping.address_line1,
    form.shipping.city,
    form.shipping.country,
    form.shipping.country_code,
    form.shipping.postal_code,
    form.shipping.state,
    form.shipping.state_code,
    selectedQuantity,
    state,
    subtotal,
  ]);

  useEffect(() => {
    setIsLoggedIn(Boolean(user));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSavedShippingAddresses([]);
      setSavedBillingAddresses([]);
      setSelectedSavedShippingAddressId("");
      setSelectedSavedBillingAddressId("");
      setSavedPaymentMethods([]);
      setSelectedSavedPaymentMethodId("");
      setPaymentMethodsError(null);
      return;
    }

    const loadPaymentMethods = async () => {
      try {
        setPaymentMethodsLoading(true);
        setPaymentMethodsError(null);
        const response = await PaymentMethodServices.listPaymentMethods();
        const methods = response?.result?.data ?? [];
        setSavedPaymentMethods(methods);
        const defaultMethod = methods.find((method) => method.is_default) || methods[0];
        setSelectedSavedPaymentMethodId(defaultMethod?.id ?? "");
      } catch (err) {
        setSavedPaymentMethods([]);
        setSelectedSavedPaymentMethodId("");
        setPaymentMethodsError(getErrorMessage(err));
      } finally {
        setPaymentMethodsLoading(false);
      }
    };

    const loadSavedAddresses = async () => {
      try {
        const response = await AddressServices.list();
        const all = response?.result?.data ?? [];
        setSavedShippingAddresses(all.filter((a) => a.shipping_type === "shipping_addr"));
        setSavedBillingAddresses(all.filter((a) => a.shipping_type === "billing_addr"));
      } catch {
        setSavedShippingAddresses([]);
        setSavedBillingAddresses([]);
      }
    };

    loadPaymentMethods();
    loadSavedAddresses();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    setForm((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        first_name: prev.shipping.first_name || user.first_name || "",
        last_name: prev.shipping.last_name || user.last_name || "",
        email: prev.shipping.email || user.email || "",
      },
      billing: {
        ...prev.billing,
        first_name: prev.billing.first_name || user.first_name || "",
        last_name: prev.billing.last_name || user.last_name || "",
        email: prev.billing.email || user.email || "",
      },
    }));
  }, [user]);

  useEffect(() => {
    setForm((prev) => {
      if (useSameAddress) {
        return {
          ...prev,
          useSameAddress: true,
          billing: { ...prev.shipping },
        };
      }
      return { ...prev, useSameAddress: false };
    });
    if (useSameAddress) {
      setBillingErrors({});
      setSelectedSavedBillingAddressId("");
    }
  }, [useSameAddress, form.shipping]);

  useEffect(()=>{
    if(reducerState.cartModalOpenFlag){
      dispatch({ type: "CART_MODAL", payload: !reducerState.cartModalOpenFlag });
    }
  },[dispatch, reducerState])

  const persistAddressIfNeeded = useCallback(
    async (
      address: AddressFields,
      shippingType: "shipping_addr" | "billing_addr",
      savedAddresses: SavedAddress[],
    ) => {
      if (!user) return;
      const alreadySaved = savedAddresses.some((saved) => addressesMatch(address, saved));
      if (alreadySaved) return;

      const response = await AddressServices.create(buildAddressPayload(address, shippingType));
      const nextAddress = response?.result?.data;
      if (!nextAddress) return;

      if (shippingType === "shipping_addr") {
        setSavedShippingAddresses((prev) => [...prev, nextAddress]);
        setSelectedSavedShippingAddressId(String(nextAddress.id));
        return;
      }

      setSavedBillingAddresses((prev) => [...prev, nextAddress]);
      setSelectedSavedBillingAddressId(String(nextAddress.id));
    },
    [user],
  );

  const handleFormChange = (field: keyof Omit<CheckoutPayload, "shipping" | "billing">) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const calculateShipping = useCallback(
    async (showError = true) => {
      const zip = (form.shipping.postal_code || "").replace(/\D/g, "").slice(0, 5);
      const selectedStateCode =
        state.find((item) => `${item.id}` === `${form.shipping.state}`)?.code ||
        form.shipping.state_code ||
        "";
      const selectedCountryCode =
        countries.find((item) => `${item.id}` === `${form.shipping.country}`)?.code ||
        form.shipping.country_code ||
        "";

      if (!zip || zip.length !== 5 || !selectedStateCode || cart.length === 0) {
        setShippingCost(0);
        return;
      }

      setShowMainPageLoader(true);
      try {
        const cartdata = cart.map((item) => ({ product_id: item.product, sku_code: item.sku_code }));
        const forms = {
          ...form,
          shipping: {
            ...form.shipping,
            state_code: selectedStateCode,
            country_code: selectedCountryCode || "US",
          },
          billing: {
            ...form.billing,
            state_code:
              state.find((item) => `${item.id}` === `${form.billing.state}`)?.code ||
              form.billing.state_code ||
              "",
            country_code:
              countries.find((item) => `${item.id}` === `${form.billing.country}`)?.code ||
              form.billing.country_code ||
              "",
          },
          cartData: cartdata,
        };

        const response = await CartServices.calculateShipping(forms);
        if (response.status === "success") {
          if(response?.result?.length > 0){
            setShippingCost(Number(response.result[0].total_charge) || 0);
          }else if(response.type === "free_shipping"){
            setFreeShipping(true)
          }
        } else {
          setShippingCost(0);
        }
      } catch (err: unknown) {
        setShippingCost(0);
        if (showError) {
          setToastNotification({ type: "error", message: getErrorMessage(err) });
        }
      } finally {
        setShowMainPageLoader(false);
      }
    },
    [cart, countries, form, setShowMainPageLoader, setToastNotification, state],
  );

  // useEffect(() => {
  //   if (currentStep === "information") return;
  //   const timeout = setTimeout(() => {
  //     calculateShipping(false);
  //   }, 350);
  //   return () => clearTimeout(timeout);
  // }, [calculateShipping, currentStep, shippingQuoteDeps]);


  const validationChecks =(form: CheckoutPayload) =>{
    const validationErrors = validateCheckout(form);
    console.log("validationErrors",validationErrors,Object.entries(validationErrors?.shipping)?.length )
    if(Object.entries(validationErrors?.shipping)?.length > 0  || (Object.entries(validationErrors?.shipping)?.length > 0 && !form?.useSameAddress)){
      // Disable the buttons
      setEnableProceedBtn(true)
      return true
    }else{
      // enable the buttons
      setEnableProceedBtn(false)
      return false

    }

  }

  useEffect(()=>{
    validationChecks(form)
  },[form])


  const goToShipping = (e: React.FormEvent) => {
    e.preventDefault();
    const is_validate= validationChecks(form)
    if(is_validate){
      return;
    }
    setCurrentStep("shipping");
    setStepsCaptured(["information", "shipping"]);
    window.scrollTo(0, 0);
    calculateShipping(true);
  };

  const goToPayment = () => {
    setStepsCaptured(["information", "shipping", "payment"]);
    setCurrentStep("payment");
    window.scrollTo(0, 0);
  };

  const goBackToInformation = () => {
    setStepsCaptured(["information"]);
    setCurrentStep("information");
    window.scrollTo(0, 0);
  };

  const goBackToShipping = () => {
    setStepsCaptured(["information", "shipping"]);
    setCurrentStep("shipping");
    window.scrollTo(0, 0);
  };

  const clearCart = () => {
    setCart([]);
    dispatch({ type: "SET_COUNT", payload: 0 });
  };


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const effectiveBilling = useSameAddress
      ? { ...form.shipping }
      : {
          ...form.billing,
          email: form.shipping.email,
          phone: form.shipping.phone,
        };

    if (!useSameAddress) {
      const validationErrors = validateAddress(effectiveBilling, "billing");
      if (Object.keys(validationErrors).length > 0) {
        setBillingErrors(validationErrors);
        setError({ message: "Billing address is incorrect. Please correct the highlighted fields.", retry: false });
        setLoading(false);
        return;
      }
    } else {
      setBillingErrors({});
    }

    if (!form.payment_method) {
      setError({ message: "Please select a payment method.", retry: false });
      setLoading(false);
      return;
    }

    const effectiveCountryCode =
      countries.find((item) => `${item.id}` === `${effectiveBilling.country}`)?.code ||
      effectiveBilling.country_code ||
      "US";

    if (form.payment_method === "card") {
      if (selectedSavedPaymentMethodId) {
        const selectedMethod = savedPaymentMethods.find((method) => method.id === selectedSavedPaymentMethodId);
        if (!selectedMethod) {
          setError({ message: "Please select a saved payment method.", retry: false });
          setLoading(false);
          return;
        }
      } else {
        if (!stripeCardHolder.trim()) {
          setError({ message: "Cardholder name is required.", retry: false });
          setLoading(false);
          return;
        }
        if (!isStripeCardComplete) {
          setError({ message: stripeCardError || "Please complete your card details.", retry: false });
          setLoading(false);
          return;
        }
        if (!stripeCardRef.current) {
          setError({ message: "Stripe card form is not ready. Please refresh and try again.", retry: false });
          setLoading(false);
          return;
        }
      }
    }

    if (taxQuoteError) {
      setError({ message: taxQuoteError, retry: true });
      setLoading(false);
      return;
    }

    const payload: CheckoutPayload & Record<string, unknown> = {
      ...form,
      useSameAddress,
      billing: effectiveBilling,
      company_name: companyName,
      user_type: userType,
      amount: total,
      subtotal,
      shipping_cost: shippingCost,
      tax_amount: taxAmount,
      tax_rate: taxRate,
      coupon_amt:couponAmount,
      idempotency_key: idempotencyKey.current,
    };

    if (form.payment_method === "card") {
      try {
        const paymentIntent = await PaymentMethodServices.createCheckoutPaymentIntent({
          amount: total,
          idempotency_key: idempotencyKey.current,
          save_payment_method: !selectedSavedPaymentMethodId && savePaymentMethod,
          payment_method_id: selectedSavedPaymentMethodId || undefined,
        });

        const confirmation = await stripeCardRef.current!.confirmCheckoutPayment({
          clientSecret: paymentIntent.client_secret,
          cardHolderName:
            stripeCardHolder.trim() ||
            savedPaymentMethods.find((method) => method.id === selectedSavedPaymentMethodId)?.name ||
            `${form.shipping.first_name} ${form.shipping.last_name}`.trim(),
          country: effectiveCountryCode,
          postalCode: effectiveBilling.postal_code,
          paymentMethodId: selectedSavedPaymentMethodId || undefined,
        });

        payload.stripe_payment_intent_id = confirmation.paymentIntentId;
        payload.save_payment_method = !selectedSavedPaymentMethodId && savePaymentMethod;
        payload.saved_payment_method_id = selectedSavedPaymentMethodId || undefined;
      } catch (err: unknown) {
        setError({ message: getErrorMessage(err), retry: false });
        setLoading(false);
        return;
      }
    }

    try {
      const response = await CheckoutServices.Checkout(payload);
      if (response?.status === "success") {
        try {
          if (saveShippingAddress) {
            await persistAddressIfNeeded(form.shipping, "shipping_addr", savedShippingAddresses);
          }
          if (!useSameAddress && saveBillingAddress) {
            await persistAddressIfNeeded(effectiveBilling, "billing_addr", savedBillingAddresses);
          }
        } catch (addressError: unknown) {
          setToastNotification({
            type: "error",
            message: `Order placed, but we could not save the address. ${getErrorMessage(addressError)}`,
          });
        }

        clearCart();
        idempotencyKey.current =
          typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : generateIdempotencyKey();

        router.push(
          `/order-success?` +
            `order_number=${response?.result?.data?.order_number}` +
            `&transaction_id=${response?.result?.data?.transaction_id}` +
            `&total=${response?.result?.data?.total}` +
            `&method=${response?.result?.data?.payment_method}`,
        );
        return;
      }
    } catch (err: unknown) {
      const canRetry =
        typeof err === "object" && err !== null && "retry" in err ? Boolean((err as { retry?: unknown }).retry) : true;
      const transactionId =
        typeof err === "object" && err !== null && "transaction_id" in err
          ? ((err as { transaction_id?: string | null }).transaction_id ?? null)
          : null;
      const message = getErrorMessage(err);

      if (!canRetry && transactionId) {
        setCurrentStep("fatal");
        setFatalError({ message, transaction_id: transactionId });
      } else {
        setToastNotification({ type: "error", message });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | string) => Number(value || 0).toFixed(2);

  const handleShippingChange = (field: keyof CheckoutPayload["shipping"]) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    if (selectedSavedShippingAddressId) {
      setSelectedSavedShippingAddressId("");
    }
    setForm((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        [field]: value,
        ...(field === "state"
          ? {
              state_code: state.find((item) => `${item.id}` === value)?.code || "",
              state_name: state.find((item) => `${item.id}` === value)?.name || "",
            }
          : {}),
        ...(field === "country"
          ? {
              country_code: countries.find((item) => `${item.id}` === value)?.code || "",
              country_name: countries.find((item) => `${item.id}` === value)?.name || "",
            }
          : {}),
      },
    }));
  };

  const handleFillShipping = (addr: SavedAddress) => {
    const nextShipping = mapSavedAddressToAddressFields(addr, form.shipping.email || user?.email || "");
    setForm((prev) => ({
      ...prev,
      shipping: nextShipping,
      ...(useSameAddress ? { billing: { ...nextShipping } } : {}),
    }));
    setSelectedSavedShippingAddressId(String(addr.id));
    setSaveShippingAddress(false);
  };

  const handleBillingChange = (field: keyof CheckoutPayload["billing"]) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    if (selectedSavedBillingAddressId) {
      setSelectedSavedBillingAddressId("");
    }
    setForm((prev) => ({
      ...prev,
      billing: {
        ...prev.billing,
        [field]: value,
        ...(field === "state"
          ? {
              state_code: state.find((item) => `${item.id}` === value)?.code || "",
              state_name: state.find((item) => `${item.id}` === value)?.name || "",
            }
          : {}),
        ...(field === "country"
          ? {
              country_code: countries.find((item) => `${item.id}` === value)?.code || "",
              country_name: countries.find((item) => `${item.id}` === value)?.name || "",
            }
          : {}),
      },
    }));
  };

  const handleFillBilling = (addr: SavedAddress) => {
    const nextBilling = mapSavedAddressToAddressFields(addr, form.shipping.email || user?.email || "");
    setForm((prev) => ({
      ...prev,
      billing: nextBilling,
    }));
    setSelectedSavedBillingAddressId(String(addr.id));
    setSaveBillingAddress(false);
  };

  const ApplyCouponCode = async (code: string) => {
    setShowMainPageLoader(true)
    try {
      const response = await CartServices.applyCouponCode(tmpId,code)

      if (response.status === "success") {
        if(response?.result){
          const updateditems = cart.map((e)=> ({...e,coupon_code:response?.result?.coupon_code, coupon_val : response?.result?.coupon_val, coupon_type: response?.result?.coupon_type }))
          setCart(updateditems)
        }
      }
    } catch (error: unknown) {
      setToastNotification({ type: "error", message: getErrorMessage(error) });
    }
    finally {
      setShowMainPageLoader(false)
    }
  };

    const RemoveCouponCode = async () => {
    if (couponcode) {
      setShowMainPageLoader(true)
      try {
        const response = await CartServices.removeCouponCode(tmpId, couponcode)
        if (response.status === "success") {
          const updateditems = cart.map((e) => ({ ...e, coupon_code: '', coupon_val: 0.00, coupon_type: '' }))
          setCart(updateditems)
          setCouponcode('')
        }
      } catch (error: unknown) {
        setToastNotification({ type: "error", message: getErrorMessage(error) });
      }
      finally {
        setShowMainPageLoader(false)
      }

    }
  }

  return (
    <Elements stripe={stripePromise}>
    <main className="max-w-6xl mx-auto px-6 py-12">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24">
          <div className="absolute inset-0 bg-[#0b2e59]/10 backdrop-blur-sm" />
          <div className="relative flex items-center gap-4 rounded-2xl border border-[#dbe7f4] bg-white px-6 py-4 shadow-[0_10px_35px_rgba(15,32,66,0.15)]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#dfe8f7] border-t-blue-600" />
            <div className="text-sm text-[#0b2e59]">
              <p className="font-semibold">Processing your order</p>
              <p className="text-[13px] text-[#4f5c7d]">Please wait while we complete the request.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#0b2e59]">Checkout</h1>
        <Link href="/cart" className="text-blue-600 hover:underline">
          Back to cart
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-[#5b6b7b] mb-8">
        <span className="font-semibold text-[#0b2e59]">Cart</span>
        <span className="h-px w-6 bg-[#dce7f1]" />
        <span className={stepsCaptured.includes("information") ? "font-semibold text-[#0b2e59]" : "text-[#9fb1c3]"}>Information</span>
        <span className="h-px w-6 bg-[#dce7f1]" />
        <span className={stepsCaptured.includes("shipping") ? "font-semibold text-[#0b2e59]" : "text-[#9fb1c3]"}>Shipping</span>
        <span className="h-px w-6 bg-[#dce7f1]" />
        <span className={stepsCaptured.includes("payment") ? "font-semibold text-[#0b2e59]" : "text-[#9fb1c3]"}>Payment</span>
      </div>

      {!isLoggedIn && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Login Required</h3>
              <p className="text-yellow-700 mb-4">You must be logged in to place an order.</p>
              <Link href="/my-account" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
                Log in or Create Account
              </Link>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 relative">
          <button onClick={() => setError(null)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xl font-bold">x</button>
          <p className="text-red-700 font-medium pr-8">{error.message}</p>
        </div>
      )}
      {taxQuoteError && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6">
          <p className="text-amber-800 font-medium">{taxQuoteError}</p>
        </div>
      )}

      {currentStep === "fatal" && fatalError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 font-medium">{fatalError.message}</p>
          <p className="text-red-700 text-sm mt-1">Transaction ID: {fatalError.transaction_id}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="space-y-6">
          {currentStep === "information" && (
            <>
              <InformationTab
                shipping={form.shipping}
                billing={form.billing}
                onShippingChange={handleShippingChange}
                onBillingChange={handleBillingChange}
                companyName={companyName}
                setCompanyName={setCompanyName}
                userType={userType}
                setUserType={setUserType}
                states={state}
                countries={countries}
                errors={errors}
                savedShippingAddresses={savedShippingAddresses}
                onFillShipping={handleFillShipping}
                selectedSavedShippingAddressId={selectedSavedShippingAddressId}
                onSelectSavedShippingAddress={setSelectedSavedShippingAddressId}
                saveShippingAddress={saveShippingAddress}
                onSaveShippingAddressChange={setSaveShippingAddress}
              />

              <div className="flex justify-between items-center">
                <Link href="/cart" className="text-blue-600 hover:underline text-sm">
                  Return to cart
                </Link>
                {!hideCheckoutBtn && <button
                  type="button"
                  onClick={goToShipping}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded text-sm font-medium ${enableProceedBtn ? 'cursor-not-allowed' :'cursor-pointer'}`}
                  disabled={!isLoggedIn || enableProceedBtn}
                >
                  Continue to shipping
                </button>}
              </div>
            </>
          )}

          {currentStep === "shipping" && (
            <ShippingTab
              shipping={form.shipping}
              billing={form.billing}
              handleFormChange={handleFormChange}
              onShippingChange={handleShippingChange}
              onBillingChange={handleBillingChange}
              companyName={companyName}
              setCompanyName={setCompanyName}
              userType={userType}
              setUserType={setUserType}
              states={state}
              countries={countries}
              goBackToInformation={goBackToInformation}
              shippingCost={shippingCost}
              customer_notes={form.customer_notes}
              formatCurrency={formatCurrency}
              goToPayment={goToPayment}
            />
          )}

          {currentStep === "payment" && (
            <PaymentTab
              form={form}
              useSameAddress={useSameAddress}
              loading={loading}
              isLoggedIn={isLoggedIn}
              billingErrors={billingErrors}
              states={state}
              countries={countries}
              shippingCost={shippingCost}
              formatCurrency={formatCurrency}
              setUseSameAddress={setUseSameAddress}
              handleSubmit={handleSubmit}
              goBackToInformation={goBackToInformation}
              goBackToShipping={goBackToShipping}
              handleFormChange={handleFormChange}
              handleBillingChange={handleBillingChange}
              stripeCardRef={stripeCardRef}
              stripeCardHolder={stripeCardHolder}
              setStripeCardHolder={setStripeCardHolder}
              onStripeCardChange={(complete, errorMessage) => {
                setIsStripeCardComplete(complete);
                setStripeCardError(errorMessage);
              }}
              savedPaymentMethods={savedPaymentMethods}
              paymentMethodsLoading={paymentMethodsLoading}
              paymentMethodsError={paymentMethodsError}
              selectedSavedPaymentMethodId={selectedSavedPaymentMethodId}
              setSelectedSavedPaymentMethodId={setSelectedSavedPaymentMethodId}
              savePaymentMethod={savePaymentMethod}
              setSavePaymentMethod={setSavePaymentMethod}
              savedBillingAddresses={savedBillingAddresses}
              selectedSavedBillingAddressId={selectedSavedBillingAddressId}
              setSelectedSavedBillingAddressId={setSelectedSavedBillingAddressId}
              onFillBilling={handleFillBilling}
              saveBillingAddress={saveBillingAddress}
              setSaveBillingAddress={setSaveBillingAddress}
            />
          )}
        </section>

        <OrderSummary
          cart={cart}
          subtotal={subtotal}
          shippingCost={shippingCost}
          taxRate={taxRate}
          taxAmount={taxAmount}
          total={total}
          formatCurrency={formatCurrency}
          couponcode={couponcode}
          setCouponcode={setCouponcode}
          ApplyCouponCode={ApplyCouponCode}
          RemoveCouponCode={RemoveCouponCode}
          couponAmount={couponAmount}
          freeShipping={freeShipping}
        />
      </div>
    </main>
    </Elements>
  );
}

