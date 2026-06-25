import AxiosInstance from "@/lib/axios";

interface TaxShippingRequest {
  shipping_city: string;
  shipping_address_line1?: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  amount: number;
  item_quantity?: number;
}

interface TaxShippingApiResponse {
  status?: string;
  result?: {
      amount_to_collect : Number
      rate : Number
      has_nexus : boolean
      taxable_amount : Number
      freight_taxable : boolean
    ;
  };
}

export interface TaxShippingQuote {
  amount_to_collect : Number
  rate : Number
  has_nexus : boolean
  taxable_amount : Number
  freight_taxable : boolean
}

const toNumber = (value: number | string | undefined): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const TaxServices = {

  calculateByZip: async (payload: TaxShippingRequest): Promise<TaxShippingApiResponse> => {
    const response = await AxiosInstance.post<TaxShippingApiResponse>("/v1/tax/calculate/", payload);
    return response.data
  },

};
