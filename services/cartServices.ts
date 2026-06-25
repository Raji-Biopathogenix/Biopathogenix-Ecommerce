import AxiosInstance from "@/lib/axios";
import {CartResponse,CartPayload,CartItemCount,CartUpdateResponse,CouponCodeResponse,ShippingCalculate,shippingCalculateResponse} from "@/types/cart";




export const CartServices = {
    updateCartItem: async (itemId: number, quantity: number): Promise<CartUpdateResponse> => {
        const response = await AxiosInstance.patch(`/v1/cart/${itemId}/`, { quantity });
        return response.data;
    },
    AddToCart: async (payload: CartPayload): Promise<CartResponse> => {
        const response = await AxiosInstance.post('/v1/cart/', payload)
        return response.data
    },

    cartItemsCount : async (tmp_id: string | null): Promise<CartItemCount> => {
        const response = await AxiosInstance.get(`/v1/cart/${tmp_id}/get_cartitems_count/`)
        return response.data
    },

    getcartItems : async (tmp_id: string | null): Promise<CartResponse> => {
        const response = await AxiosInstance.get(`/v1/cart/${tmp_id}/cartItems/`)
        return response.data
    },
    getcheckoutItems : async (tmp_id: string | null): Promise<CartResponse> => {
        const response = await AxiosInstance.get(`/v1/cart/${tmp_id}/checkoutItems/`)
        return response.data
    },
    deleteCartItem : async(itemId:number) : Promise<CartResponse> => {
        const response = await AxiosInstance.delete(`/v1/cart/${itemId}/`)
        return response.data
    },
    updateCartItemSelect : async(itemId:number,checked:boolean) : Promise<CartResponse> => {
        const response = await AxiosInstance.get(`/v1/cart/${itemId}/items_selection/?selection=${checked}`)
        return response.data
    },
    updateAllCartItemSelection : async(tmpId:string | null,type:string) : Promise<CartResponse> => {
        const response = await AxiosInstance.get(`/v1/cart/${tmpId}/items_selection/?selection_type=${type}`)
        return response.data
    },
    applyCouponCode : async(tmp_id: string | null,code:string | null) : Promise<CouponCodeResponse> => {
        const response = await AxiosInstance.get(`/v1/cart/${tmp_id}/coupon_code_validate/?coupon_code=${code}`)
        return response.data
    },

    removeCouponCode : async(tmp_id: string | null,code:string | null) : Promise<CouponCodeResponse> => {
        const response = await AxiosInstance.get(`/v1/cart/${tmp_id}/remove_coupon_code/?coupon_code=${code}`)
        return response.data
    },
    
    clearCart : async(tmp_id: string | null) : Promise<CouponCodeResponse> => {
        const response = await AxiosInstance.get(`/v1/cart/${tmp_id}/cart_clear/`)
        return response.data
    },

    calculateShipping : async(payload:ShippingCalculate) : Promise<shippingCalculateResponse> => {
        const response = await AxiosInstance.post(`/v1/rates/`,payload)
        return response.data
    },
}
