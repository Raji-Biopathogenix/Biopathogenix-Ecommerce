export interface  LoginState  {
  email: string;
  password: string;
  remember: boolean;
};

export interface  State  {
  id : number,
  name: string,
  code?: string,
}

export interface  Country  {
  id : number,
  name: string,
  code?: string,
}

export interface RegisterState  {
  email: string;
  user_type: string;
  first_name: string;
  last_name: string;
  Company_name: string;
  Street_Address: string;
  Address_Line_2: string;
  state: number | null ;
  Town_City: string;
  Zip_Code: string;
  phone_number: string;
};



export interface SignUpResponse {
    status: string
    msg: string
    data: {
        id: number
        email: string
        first_name: string
        last_name: string
    }
}


export interface LoginPayload {
    email: string
    password: string
}


export interface LoginResponse {
    access_token: string
    msg: string
    refresh_token: string
    status: string
}


export interface UserActiveResponse {
  status:string
  message:string
  result?:{
    is_active:boolean
    first_name:string
    last_name:string
    status:boolean
  }
  
}

export interface EmailAvailabilityResponse {
  status: string
  message: string
  exists: boolean
}


