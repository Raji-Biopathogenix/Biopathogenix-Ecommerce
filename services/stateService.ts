// src/services/stateService.ts
import AxiosInstance from "@/lib/axios"


export interface State {
    id:   number
    name: string
    code:string
}

export interface StateResponse {
    status: string,
    message : string,
    result:{
        data: State[]
    }
}




export interface Country {
    id:   number
    name: string
    code : string
}

export interface CountryResponse {
    status: string,
    message : string,
    result:{
        data: Country[]
    }
}
export const stateService = {
    getAllStates: async (): Promise<StateResponse> => {
        const response = await AxiosInstance.get("/v1/states/")
        return response.data;
    },


    getAllCountries: async (): Promise<CountryResponse> => {
        const response = await AxiosInstance.get("/v1/countries/")
        return response.data;
    },
}


