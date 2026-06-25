import AxiosInstance from "@/lib/axios";

export type SavedPaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  exp_month: number | null;
  exp_year: number | null;
  fingerprint: string;
  country: string;
  name: string;
  is_default: boolean;
};

export const PaymentMethodServices = {
  async createSetupIntent(): Promise<{ client_secret: string; customer_id: string }> {
    const response = await AxiosInstance.post("/v1/payment-methods/setup-intent/");
    return response.data;
  },

  async createCheckoutPaymentIntent(payload: {
    amount: number;
    idempotency_key: string;
    save_payment_method?: boolean;
    payment_method_id?: string;
  }): Promise<{ client_secret: string; payment_intent_id: string; customer_id: string }> {
    const response = await AxiosInstance.post("/v1/payment-methods/payment-intent/", payload);
    return response.data;
  },

  async savePaymentMethod(payment_method_id: string): Promise<{ status: string; message: string; result: { data: SavedPaymentMethod } }> {
    const response = await AxiosInstance.post("/v1/payment-methods/save/", { payment_method_id });
    return response.data;
  },

  async listPaymentMethods(): Promise<{ status: string; result: { data: SavedPaymentMethod[] } }> {
    const response = await AxiosInstance.get("/v1/payment-methods/");
    return response.data;
  },
};
