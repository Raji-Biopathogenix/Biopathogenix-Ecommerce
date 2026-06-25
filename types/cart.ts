import {ProductSkus} from "./product";

export interface CartVariantOption {
  variant_option_id?: number;
  variant_name: string;
  variant_value: string;
}


export interface CartItem {
  // id: number;
  // product: {
  //   id: number;
  //   name: string;
  //   slug: string;
  //   category_name: string;
  //   price: number | string;
  //   compare_price?: number | string | null;
  //   primary_image?: { image_url: string } | null;
  // };
  // quantity: number;
  // total_price: number | string;


  id:number;
  user : number;
  product : number;
  quantity : number;
  price: number;
  total_price : number;
  tax_value: number;
  tmp_id:string;
  product_obj:{
    id: number;
    name:string;
    slug:string;
    sku:string;
    price: number;
    stock_quantity : number;
    is_in_stock:boolean;
    is_featured:boolean;
    primary_image:{
      image: string;
    };
  },
  
  product_sku:{
    price:number
    stock:number
  },
  low_stock?: boolean
  removeitem?: boolean
  sku_code : string
  selected:boolean

  
  has_variants: boolean;
  variant_options?: CartVariantOption[];
  coupon_code : string | undefined;
  coupon_val: number | undefined;
  coupon_type: string | undefined;
};

export interface CartResponse  {
  status: string;
  message: string;
  result: {
    data: CartItem[];
  };

};

export interface CartUpdateResponse  {
  status: string;
  message: string;
  result: {
    data: CartItem;
  };

};


export interface CartPayload  {
  product_id: number;
  tmp_id: string;
  quantity?: number;
  has_variants ?: boolean;
  price ?:number;
  skuObj ?: ProductSkus;
  is_customizable ?: boolean;
  prd_customization_prices ?:{
    price?: number | string,
  } | null
};


export interface CartItemCount  {
  status: string;
  message: string;
  result: {
    count: number;
  };
};

export interface CouponCodeResponse{
  status: string;
  message: string;
  result?: {
    coupon_code : string
    coupon_val : number
    coupon_type : string
  };
}



export interface AddressFields {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postal_code: string;
    country:string;
    state_code:string;
    country_code:string;
    state_name:string;
    country_name:string;
}

export interface ShipCartItem{
  product_id : Number
  sku_code : string
}

export interface ShippingCalculate {
  shipping: AddressFields,
  billing: AddressFields,
  useSameAddress?: boolean
  cartData: ShipCartItem[]
};

export interface UPSShippingCalulation{
  service_code : string
  service_name : string
  currency : string
  total_charge : number
  billing_weight : number 
  billing_weight_unit : string
}

export interface shippingCalculateResponse {

  status : string
  message : string
  result : UPSShippingCalulation[]
  type?:string

}
