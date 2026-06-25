import AxiosInstance from "@/lib/axios";
import {CheckoutPayload,CheckoutResponse} from "@/types/checkout";



export const CheckoutServices = {
    Checkout: async (payload: CheckoutPayload): Promise<CheckoutResponse> => {
        const response = await AxiosInstance.post('/v1/checkout/', payload)
        return response.data
    }
}