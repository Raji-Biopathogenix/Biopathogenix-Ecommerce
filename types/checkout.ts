export interface OrderItem {
    id : number,
}

export interface CheckoutResponse{
    status: string,
    message : string,
    result :   { data : {
      order_number : string
      transaction_id :string
      total: number
      payment_method : string
    }};
}


export interface CartItem {
  product_id: string | number;
  qty:        number;
  price:      number;
}

export interface AppError {
  message:         string;
  retry:           boolean;
  transaction_id?: string;
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

export interface CheckoutPayload {
    shipping: AddressFields;
    billing: AddressFields;
    useSameAddress: boolean;
    customer_notes: string;
    payment_method: string ; // extend as needed
    stripe_payment_intent_id?: string;
    save_payment_method?: boolean;
    saved_payment_method_id?: string;
}


export interface QbCardData {
  cardNumber:  string;
  expMonth:    string;
  expYear:     string;
  cvv:         string;
  cardHolder:  string;
}


export type AddressErrors = Partial<Record<keyof AddressFields, string>>;

export interface CheckoutErrors {
    shipping: AddressErrors;
    billing: AddressErrors;
}

export interface Shipping{

}
