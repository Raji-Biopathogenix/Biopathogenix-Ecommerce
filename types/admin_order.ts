// export type OrderStatus = "paid" |  "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "return_requested" | "return_approved" | "return_rejected" | "out_for_delivery";
export type ReturnOrderStatus = "none" | "return_requested" | "return_approved" | "return_rejected";

export interface OrderItem {
  id: string;
  product_name: string;
  sku_code: string;
  quantity: number;
  unit_price: number;
  image?: string;
}


export interface Order {
  id: string;
  customer: string;
  email: string;
  created_at: string;
  status: OrderStatus;
  return_status : ReturnOrderStatus | null;
  items_count: number;
  // items: OrderItem[];
  amount: number;
  shipping_address_line1: string;
  paymentMethod: string;
  payment_method_display: string
  card_last4: string
  card_brand: string
  card_name:string
  shipment_id?:string | null
  tracking_number?:string | null
  ups_tracking_url?:string | null
  shipping_label?:string | null
  is_cancellable?: boolean
  is_refundable: boolean
}




export interface AllOrderResponse {
  status: string
  message: string
  result: {
    data: Order,
    "pagination": {
      "total_items": number,
      "total_pages": number,
      "current_page": number,
      "page_size": number,
      "next": string,
      "previous": string,
    }
  }

}

export interface AllOrderState {

    data: Order,
    "pagination": {
      "total_items": number,
      "total_pages": number,
      "current_page": number,
      "page_size": number,
      "next": string,
      "previous": string,
    }
  

}

export interface OrderUpdateResponse {
  status: string
  message: string
  result: {
    data: Order
  }

}

export interface OrderItemResponse {
  status: string
  message: string
  result: {
    data: OrderItem[]
  }

}

export interface AllOrderPayload{
  page?: number;
  from_date?: string;
  to_date?: string;
  order_id?: string;
  status?: string;
  return_status?: string;
  payment_method? : string;

}

export interface orderEditPayload{
    orderId: number;
    transactionId?: string;
    status?: OrderStatus;
}



// types/order.ts

export type ItemStatus = 'unshipped' | 'in_transit' | 'delivered' | 'returned';
export type ItemReturnStatus = 'none' | 'initiated' | 'requested' | 'approved' | 'returned';
export type ShipmentStatus =
  | 'label_created'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export type ShipmentType = 'outbound' | 'return';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'confirmed'
  | 'processing'
  | 'partially_shipped'
  | 'shipped'
  | 'partially_delivered'
  | 'delivered'
  | 'out_for_delivery'
  | 'return_requested'
  | 'return_approved'
  | 'return_rejected'
  | 'partially_returned'
  | 'returned'
  | 'completed'
  | 'cancelled'
  | 'partially_refunded'
  | 'refunded';

export interface OrderItemShipment {
  id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  status: string;
  return_status: ItemReturnStatus;
  is_returned: boolean;
  is_returnable: boolean;
  is_cancelled: boolean;
  cancel_notes : string | null;
}

export interface Shipment {
  id: number;
  order: number;
  shipment_type: ShipmentType;
  status: ShipmentStatus;
  items: OrderItemShipment[];
  item_count: number;
  tracking_number: string;
  shipment_id: string;
  carrier: string;
  shipping_label?: string;
  label_created_at: string;
  return_reason?: string;
  initiated_by?: string;
  is_return: boolean;
  return_initiated_at?: string;
}

export interface OrderShipment {
  id: number;
  transaction_id: string;
  payment_method: string;
  status: OrderStatus;
  customer_name: string;
  created_at: string;
  items: OrderItemShipment[];
  outbound_shipments: Shipment[];
  return_shipments: Shipment[];
}

export interface ReturnPayload {
  item_ids: number[];
  reason: string;
}

export interface ReturnResponse {
  id: number;
  tracking_number: string;
  status: string;
  items: OrderItem[];
  return_reason: string;
  return_initiated_at: string;
}

export interface CreateShipmentPayload {
  item_ids: number[];
  weight_lb?: number;
}


export interface OrderShipmentResponse {
  status: string
  message: string
  result: {
    data: OrderShipment
  }
}

  
export interface CreateOrderShipmentResponse {
  status: string
  message: string
  data?: ReturnResponse | undefined
}

  

export type RefundStatus = 'none' | 'pending' | 'processed' | 'failed';

export interface CancelRefundEligibility {
  order_id:       number;
  status:         string;
  total_amount:   string;
  is_cancellable: boolean;
  is_refundable:  boolean;
  refund_status:  RefundStatus;
  refund_amount:  string | null;
  cancelled_at:   string | null;
  cancel_reason:  string | null;
}

export interface CancelResult {
  status: string;
  data: {
    cancelled_at:string;
    cancelled_by:string;
  }
  message: string;
}

export interface RefundResult {
 
  status: string;
  data: {
    status ?:  string;
    refund_status?: string;
    refund_amount: string;
    refunded_at: string;
    refund_reference?: string;
    refunded_by?: string;
  }
  message: string;
}

export interface CancelOrderItemResponse {
  status: string;
  data: {
    item_id: number;
    cancelled_at:string;
    cancelled_by:string;
    product_name: string;
    cancel_notes: string | null;
  }
  message: string;
}



export interface Item {
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface LabelData {
  status:string
  message: string
  shipment_id: number;
  order_id: number;
  order_number: string;
  tracking_number: string;
  carrier: string;
  is_return: boolean;
  label_url: string;
  label_created_at: string;
  return_reason?: string;
  items: Item[];
  subtotal: string;
  tax: string;
  total: string;
  ship_to: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
  ship_from: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
  };
  company: {
    name: string;
    email: string;
    website: string;
    phone: string;
  };
}