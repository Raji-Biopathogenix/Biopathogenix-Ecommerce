export interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price?: number | string;
  total: number | string;
  status: string | null;
  is_cancelled: boolean;
}

export interface OrderShipment {
  id: number;
  tracking_number: string | null;
  tracking_url: string | null;
  status: string;
  carrier: string;
  shipment_type: string;
  items: { product_name: string; quantity: number }[];
}

export interface OrderStatusUpdate {
  status: string;
  notes: string | null;
  created_at: string;
}

export interface OrderSummary {
  id: number;
  order_number: string;
  transaction_id: string;
  amount: string | number;
  status: string;
  return_status ?: string | null;
  tracking_number?: string | null;
  created_at: string;
  customer_name: string;
  customer_email: string;
  payment_method: string;
  payment_method_display: string;
  items: OrderItem[];
  shipments: OrderShipment[];
  status_updates: OrderStatusUpdate[];
  shipping_summary: string;
  is_return_eligible:boolean
  return_requested_reason?:string | null;
  return_rejected_reason ?: string | null;
  return_deadline?:string;
  ups_tracking_url:string | null
  shipment_id?:string | null
  shipping_label?:string | null
}


export interface OrderRetutnReqResponse{
  status : string
  message : string
}