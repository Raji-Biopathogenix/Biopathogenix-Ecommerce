"use client";

import AxiosInstance from "@/lib/axios";
import { OrderSummary } from "@/types/order";
import { CreateShipmentPayload,AllOrderResponse ,OrderItemResponse,AllOrderPayload,orderEditPayload,OrderUpdateResponse,OrderShipmentResponse,CreateOrderShipmentResponse,CancelResult,CancelOrderItemResponse,RefundResult,LabelData} from "../types/admin_order";

type OrderListResponse = {
  status: string;
  message?: string;
  result: {
    data: OrderSummary[];
  };
};

export const OrderServices = {
  async fetchUserOrders(): Promise<OrderListResponse> {
    const response = await AxiosInstance.get("/orders/");
    return response.data;
  },

  async fetchAllOrders(payload:AllOrderPayload): Promise<AllOrderResponse> {
    const params = new URLSearchParams();
    if (payload?.page)params.append("page",String(payload.page));
    if (payload?.from_date)params.append("from_date",payload.from_date);
    if (payload?.to_date)params.append("to_date",payload.to_date);
    if (payload?.order_id)params.append("order_id",payload.order_id);
    if (payload?.status)  params.append("status",payload.status);
    if (payload?.return_status)  params.append("status",payload.return_status);
    if (payload?.payment_method) params.append("payment_method", payload.payment_method);
    const response = await AxiosInstance.get(`/all_orders/?${params.toString()}`);
    return response.data;
  },

  async fetchOrderItems(order_id:Number): Promise<OrderItemResponse>{
    const response = await AxiosInstance.get(`/orderItems/?order_id=${order_id}`);
    return response.data;
  },


    async fetchShipmentOrderItems(order_id:Number): Promise<OrderShipmentResponse>{
    const response = await AxiosInstance.get(`/shipment_orderItems/?order_id=${order_id}`);
    return response.data;
  },


  


  async OrderReturnReq(order_id:Number,note:string): Promise<OrderItemResponse>{
    const response = await AxiosInstance.get(`/order_return_request/?order_id=${order_id}&note=${note}`);
    return response.data;
  },

  async AdminOrderReturnReq(order_id:Number,type:string,note:string,refundamt:number): Promise<OrderItemResponse>{
    const response = await AxiosInstance.get(`/admin_order_return_handle/?order_id=${order_id}&type=${type}&note=${note}&refundamt=${refundamt}`);
    return response.data;
  },

  async AdminOrderEditReq(payload:orderEditPayload): Promise<OrderUpdateResponse>{
    const response = await AxiosInstance.post(`/admin_order_edit_handle/`,payload);
    return response.data;
  },
  async CreateOrderShipments(orderId:number,payload:CreateShipmentPayload): Promise<CreateOrderShipmentResponse>{
    const response = await AxiosInstance.post(`/${orderId}/create_order_shipments/`,payload);
    return response.data;
  },

  async ReturnOrderInitiate(orderId:number,payload:CreateShipmentPayload): Promise<CreateOrderShipmentResponse>{
    const response = await AxiosInstance.post(`/${orderId}/initiate_return/`,payload);
    return response.data;
  },

  async CancelOrder(orderId:number,payload:{"cancel_notes":string}): Promise<CancelResult>{
    const response = await AxiosInstance.post(`/${orderId}/cancel/`,payload);
    return response.data;
  },

  async RefundOrder(orderId:number,payload:{refund_amount:number,refund_notes:string}): Promise<RefundResult>{
    const response = await AxiosInstance.post(`/${orderId}/refund/`,payload);
    return response.data;
  },

  
  async CancelOrderItem(orderId:number,orderItem:number,payload:{"cancel_notes":string}): Promise<CancelOrderItemResponse>{
    const response = await AxiosInstance.post(`/${orderId}/items/${orderItem}/cancel/`,payload);
    return response.data;
  },


  async PrintShipmentLabel(shipment_id:Number | undefined): Promise<LabelData>{
    const response = await AxiosInstance.get(`/${shipment_id}/printlable`);
    return response.data;
  }


};


// export const orders: Order[] = [
//   {
//     id: "ORD-001",
//     customer: "Arjun Sharma",
//     email: "arjun.sharma@email.com",
//     date: "2025-04-12",
//     status: "delivered",
//     total: 249.97,
//     address: "42 MG Road, Bengaluru, Karnataka 560001",
//     paymentMethod: "Visa •••• 4242",
//     items: [
//       { id: "i1", name: "Wireless Noise-Cancelling Headphones", sku: "WH-1000XM5", quantity: 1, price: 149.99 },
//       { id: "i2", name: "USB-C Charging Cable 2m", sku: "USB-C-2M", quantity: 2, price: 24.99 },
//       { id: "i3", name: "Cable Organiser Pouch", sku: "CO-BLK", quantity: 1, price: 49.99 },
//     ],
//   },
//   {
//     id: "ORD-002",
//     customer: "Priya Nair",
//     email: "priya.nair@email.com",
//     date: "2025-04-13",
//     status: "processing",
//     total: 899.00,
//     address: "15 Marine Drive, Mumbai, Maharashtra 400020",
//     paymentMethod: "Mastercard •••• 8821",
//     items: [
//       { id: "i4", name: "Mechanical Keyboard TKL", sku: "KB-TKL-WHT", quantity: 1, price: 159.00 },
//       { id: "i5", name: "27\" 4K IPS Monitor", sku: "MON-27-4K", quantity: 1, price: 549.00 },
//       { id: "i6", name: "Monitor Arm Dual", sku: "MA-DUAL", quantity: 1, price: 89.00 },
//       { id: "i7", name: "Anti-Glare Screen Protector", sku: "SP-27-AG", quantity: 1, price: 29.00 },
//       { id: "i8", name: "HDMI 2.1 Cable", sku: "HDMI-2M", quantity: 1, price: 19.99 },
//       { id: "i9", name: "DisplayPort Cable", sku: "DP-2M", quantity: 1, price: 18.99 },
//     ],
//   },
//   {
//     id: "ORD-003",
//     customer: "Rohit Verma",
//     email: "rverma@gmail.com",
//     date: "2025-04-11",
//     status: "pending",
//     total: 59.98,
//     address: "7 Connaught Place, New Delhi 110001",
//     paymentMethod: "UPI / Razorpay",
//     items: [
//       { id: "i10", name: "Laptop Stand Aluminium", sku: "LS-ALU-SLV", quantity: 1, price: 39.99 },
//       { id: "i11", name: "Microfibre Cleaning Kit", sku: "CK-MFB", quantity: 1, price: 9.99 },
//       { id: "i12", name: "Thermal Paste 5g", sku: "TP-5G", quantity: 1, price: 9.99 },
//     ],
//   },
//   {
//     id: "ORD-004",
//     customer: "Sneha Kulkarni",
//     email: "sneha.k@outlook.com",
//     date: "2025-04-10",
//     status: "shipped",
//     total: 429.95,
//     address: "23 Baner Road, Pune, Maharashtra 411045",
//     paymentMethod: "Net Banking — HDFC",
//     items: [
//       { id: "i13", name: "Ergonomic Office Chair", sku: "CHAIR-ERG-BLK", quantity: 1, price: 399.95 },
//       { id: "i14", name: "Lumbar Support Cushion", sku: "LSC-GRY", quantity: 1, price: 29.99 },
//     ],
//   },
//   {
//     id: "ORD-005",
//     customer: "Deepak Menon",
//     email: "deepak.menon@corp.in",
//     date: "2025-04-09",
//     status: "cancelled",
//     total: 189.50,
//     address: "88 Anna Salai, Chennai, Tamil Nadu 600002",
//     paymentMethod: "Visa •••• 1117",
//     items: [
//       { id: "i15", name: "Portable SSD 1TB", sku: "SSD-1TB-BLK", quantity: 1, price: 119.50 },
//       { id: "i16", name: "NVMe Enclosure USB4", sku: "NVMe-ENC-USB4", quantity: 1, price: 69.99 },
//     ],
//   },
//   {
//     id: "ORD-006",
//     customer: "Kavya Reddy",
//     email: "kavya.r@techbiz.io",
//     date: "2025-04-08",
//     status: "delivered",
//     total: 74.97,
//     address: "5 Banjara Hills, Hyderabad, Telangana 500034",
//     paymentMethod: "Paytm Wallet",
//     items: [
//       { id: "i17", name: "Webcam 1080p Pro", sku: "WC-1080P", quantity: 1, price: 59.99 },
//       { id: "i18", name: "Mini Tripod Desktop", sku: "TRI-DESK-BLK", quantity: 1, price: 14.99 },
//     ],
//   },
//   {
//     id: "ORD-007",
//     customer: "Manish Agarwal",
//     email: "m.agarwal@finance.co",
//     date: "2025-04-07",
//     status: "processing",
//     total: 1149.00,
//     address: "12 Salt Lake, Kolkata, West Bengal 700064",
//     paymentMethod: "EMI — Axis Bank",
//     items: [
//       { id: "i19", name: "Gaming PC Build Kit", sku: "GPCBK-RTX40", quantity: 1, price: 999.00 },
//       { id: "i20", name: "Case Fan RGB 120mm x3", sku: "FAN-120-RGB3", quantity: 1, price: 49.99 },
//       { id: "i21", name: "ARGB Fan Hub Controller", sku: "FHC-ARGB", quantity: 1, price: 34.99 },
//       { id: "i22", name: "Thermal Compound Premium", sku: "TC-PREM-12G", quantity: 1, price: 14.99 },
//       { id: "i23", name: "Cable Management Kit", sku: "CMK-BLK", quantity: 1, price: 19.99 },
//       { id: "i24", name: "Anti-Static Wrist Strap", sku: "ASWS-BLK", quantity: 1, price: 9.99 },
//       { id: "i25", name: "Dust Filter Magnetic 200mm", sku: "DF-200-MAG", quantity: 1, price: 12.99 },
//       { id: "i26", name: "Modular PSU Extension Kit", sku: "PSU-EXT-WHT", quantity: 1, price: 27.99 },
//     ],
//   },
//   {
//     id: "ORD-008",
//     customer: "Ananya Joshi",
//     email: "ananya.j@design.studio",
//     date: "2025-04-06",
//     status: "pending",
//     total: 329.98,
//     address: "90 Koramangala, Bengaluru, Karnataka 560034",
//     paymentMethod: "Google Pay",
//     items: [
//       { id: "i27", name: "Graphics Tablet A4 Pro", sku: "GT-A4-PRO", quantity: 1, price: 289.99 },
//       { id: "i28", name: "Stylus Replacement Tips x10", sku: "SRT-10", quantity: 1, price: 14.99 },
//       { id: "i29", name: "Pen Holder Stand", sku: "PHS-BLK", quantity: 1, price: 24.99 },
//     ],
//   },
// ];