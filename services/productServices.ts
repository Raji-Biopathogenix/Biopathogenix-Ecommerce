import AxiosInstance from "@/lib/axios";

import {  ProductsByCategoryResponse } from "@/types/product";


export const productServices = {
    fetchProductBySubCat: async (url: string): Promise<ProductsByCategoryResponse> => {
        const response = await AxiosInstance.get(url);
        return response.data;
    }
}
