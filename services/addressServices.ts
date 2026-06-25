import AxiosInstance from "@/lib/axios";

export type SavedAddress = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: number;
  state_code: string;
  state_name: string;
  country: number;
  country_code: string;
  country_name: string;
  postal_code: string;
  shipping_type: "shipping_addr" | "billing_addr";
};

export type AddressPayload = Omit<SavedAddress, "id" | "state_code" | "state_name" | "country_code" | "country_name">;

export const AddressServices = {
  async list(): Promise<{ status: string; result: { data: SavedAddress[] } }> {
    const response = await AxiosInstance.get("/v1/address/");
    return response.data;
  },

  async create(payload: AddressPayload): Promise<{ status: string; message: string; result: { data: SavedAddress } }> {
    const response = await AxiosInstance.post("/v1/address/", payload);
    return response.data;
  },

  async update(id: number, payload: AddressPayload): Promise<{ status: string; message: string; result: { data: SavedAddress } }> {
    const response = await AxiosInstance.put(`/v1/address/${id}/`, payload);
    return response.data;
  },

  async remove(id: number): Promise<{ status: string; message: string }> {
    const response = await AxiosInstance.delete(`/v1/address/${id}/`);
    return response.data;
  },
};
