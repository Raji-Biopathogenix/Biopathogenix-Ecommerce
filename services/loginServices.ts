import AxiosInstance from "@/lib/axios";
import {  RegisterState ,SignUpResponse,LoginPayload,LoginResponse,UserActiveResponse,EmailAvailabilityResponse } from '@/types';



export const loginServices = {
    checkEmailAvailability: async (email: string): Promise<EmailAvailabilityResponse> => {
        const response = await AxiosInstance.get(`/v1/check-email/?email=${encodeURIComponent(email)}`)
        return response.data
    },

    UserSignUp: async (payload: RegisterState): Promise<SignUpResponse> => {
        const response = await AxiosInstance.post('/v1/signup/', payload)
        return response.data
    },

    UserSignIn: async (payload: LoginPayload): Promise<LoginResponse> => {
        const response = await AxiosInstance.post('/v1/login/', payload)
        return response.data
    },
    

    updateUserStatus: async (uuid: string): Promise<UserActiveResponse> => {
        const response = await AxiosInstance.get(`/v1/activate-user/?uid=${uuid}`)
        return response.data
    },
}
