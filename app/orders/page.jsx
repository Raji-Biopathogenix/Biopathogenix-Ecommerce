"use client";
import { useState, useMemo, useEffect,useCallback } from "react";
import OrdersTable from "../../components/orders/OrdersTable";
import OrderModal from "../../components/orders/OrderModal";
import OrdersPage from "../../components/orders/OrdersPage";
import { OrderServices } from "../../services/orderServices";
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import AdminOrderEditModal from "@/components/Modal/Order/AdminOrderEditModal";
import Pagination from "@/components/pagination/pagination";
import { ShoppingBag } from "lucide-react";
import CancelRefundModal from "@/components/Modal/Order/CancelRefundModal";

export default function OrdersDashboard() {

  const { setToastNotification } = useToast()
  const { setShowMainPageLoader, user } = useAuth()
  const router = useRouter()

  const [orders, setOrders] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState(null);
  const [orderObj, setOrderObj] = useState(null);
  const [showCancelRefund, setShowCancelRefund] = useState(false);

  const params = useParams()
  const searchParams = useSearchParams()

  const fetchOrders = async () => {
    try {
      setShowMainPageLoader(true)
      let payload = {}
      if (searchParams.get("page")) {
        payload = { ...payload, page: searchParams.get("page") }
      }
      if (searchParams.get("from_date")) {
        payload = { ...payload, from_date: searchParams.get("from_date") }
      }

      if (searchParams.get("to_date")) {
        payload = { ...payload, to_date: searchParams.get("to_date") }
      }

      if (searchParams.get("order_id")) {
        payload = { ...payload, order_id: searchParams.get("order_id") }
      }

      if (searchParams.get("status")) {
        payload = { ...payload, status: searchParams.get("status") }
      }

      if (searchParams.get("return_status")) {
        payload = { ...payload, return_status: searchParams.get("return_status") }
      }

      if (searchParams.get("payment_method")) {
        payload = { ...payload, payment_method: searchParams.get("payment_method") }
      }



      const response = await OrderServices.fetchAllOrders(payload)
      if (response?.status === "success") {
        if (response?.result?.data?.length > 0) {
          setOrders(response?.result)
        } else {
          setOrders({ data: [] })
        }
        setToastNotification({
          type: 'success',
          message: response?.message
        })
      }
    } catch (error) {
      setShowMainPageLoader(false)
      setToastNotification({ type: 'error', message: (error?.message) })
      if (error?.status == 403) {
        router.push('/access-denied')
      }
    } finally {
      setShowMainPageLoader(false)
    }

  }

  // useEffect(()=>{
  //   if(!user){
  //     router.replace('/')
  //   }
  // },[user])

  useEffect(() => {
    if (searchParams) {
      console.log("searchParams", searchParams.get("page"))
      fetchOrders()
    }
  }, [searchParams])

  

    // Re-fetch order from Next.js API proxy
  const refresh = useCallback(async (orderObj) => {

    console.log("refresh called with orderObj", orderObj)

    setShowMainPageLoader(true)
    try {
      const response = await OrderServices.fetchShipmentOrderItems(orderObj?.id)
      console.log("fetchShipmentOrderItems response", response)

      if (response?.status === "success") {
        if (response?.result?.data) {
          setOrderObj(response?.result?.data)
        } else {
          setOrderObj(null)
        }
        setToastNotification({
          type: 'success',
          message: response?.message
        })
      }
    } catch(error){
      setOrderObj(null)
      setShowMainPageLoader(false)
      setToastNotification({
        type: 'error',
        message: (error?.message)
      })
    } finally {
      setShowMainPageLoader(false)
    }
  }, []);


  const selectedOrderModal = async (order) => {
    setShowMainPageLoader(true)
    try {
      const response = await OrderServices.fetchOrderItems(order?.id)
      if (response?.status === "success") {
        if (response?.result?.data?.length > 0) {
          setSelectedOrder(order)
          setOrderItems(response?.result?.data)
        } else {
          setOrderItems([])
        }
        setToastNotification({
          type: 'success',
          message: response?.message
        })
      }
    } catch (error) {
      setShowMainPageLoader(false)
      setToastNotification({
        type: 'error',
        message: (error?.message)
      })
    } finally {
      setShowMainPageLoader(false)
    }

  }



  const handleOrderEdit = async (order) => {
    refresh(order)
  }


  const handleCancelRefund = (order) => {
    setSelectedOrder(order);
    setShowCancelRefund(true);
};
  



  const handleOrderEditRequest = async (payload) => {

    setShowMainPageLoader(true)
    try {
      const response = await OrderServices.AdminOrderEditReq(payload)
      if (response?.status === "success") {
        setOrders((prevOrders) => {
          if (!prevOrders) return prevOrders;
          return {
            ...prevOrders,
            data: prevOrders.data.map((order) =>
              order.id === payload?.orderId ? { ...response?.result?.data } : order
            ),
          };
        });
        setOrderObj(null)
        setToastNotification({
          type: 'success',
          message: response?.message
        })
      }
    } catch (error) {
      setShowMainPageLoader(false)
      setToastNotification({
        type: 'error',
        message: (error?.message)
      })
    } finally {
      setShowMainPageLoader(false)
    }

  }


  if (!orders) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
        <div className="text-center">
          <p className="font-medium text-gray-800">Fetching orders</p>
          <p className="text-sm text-gray-500 mt-1">Hang tight, loading your orders.</p>
        </div>
        <div className="w-48 space-y-2 mt-2">
          <div className="h-3 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
        </div>
      </div>
    );
  }

  if (!orders?.data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-gray-800">No orders yet</p>
          <p className="text-sm text-gray-500 mt-1">
            You haven't placed any orders. Start shopping to see them here.
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="mt-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Home
        </button>
      </div>
    );
  }


  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", color: "#111111", fontFamily: "sans-serif" }}>
      {orderObj && orderObj?.items?.length > 0 && (
        <AdminOrderEditModal
          order={orderObj}
          amount={0}
          onClose={() => setOrderObj(null)}
          onSubmit={handleOrderEditRequest}
          onRefresh={refresh}
        />
      )}

      <main style={{ padding: "32px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#111111" }}>Orders</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
            Manage and track all customer orders
          </p>
        </div>


        <OrdersPage page={(searchParams.get("page") || 1).toString()} from_date={searchParams.get("from_date") || ""} to_date={searchParams.get("to_date") || ""} order_id={searchParams.get("order_id") || ""} statuses={(searchParams.get("status"))?.split(',') || []} paymentMethods={(searchParams.get("payment_method"))?.split(",") || []} return_status={(searchParams.get("return_status"))?.split(',') || []} />
        <OrdersTable orders={orders?.data} onViewOrder={selectedOrderModal} handleOrderEdit={handleOrderEdit} handleCancelRefund={handleCancelRefund} />
        {orders?.pagination && <Pagination
          currentPage={orders?.pagination?.current_page}
          totalPages={orders?.pagination?.total_pages}
          count={orders?.pagination?.count}
          labelVal="Orders"
        />}
      </main>
      {selectedOrder && orderItems && (
        <OrderModal items={orderItems} order={selectedOrder} onClose={() => { setOrderItems(null); setSelectedOrder(null) }} />
      )}


      
    {showCancelRefund && selectedOrder && (
      <CancelRefundModal
        orderId={selectedOrder.id}
        orderNumber={selectedOrder.id}
        eligibility={{
          order_id: selectedOrder.id,
          status: selectedOrder.status,
          total_amount: selectedOrder.amount,
          is_cancellable: selectedOrder.is_cancellable,
          is_refundable: selectedOrder.is_refundable,
          refund_status: selectedOrder.refund_status ?? 'none',
          refund_amount: selectedOrder.refund_amount ?? null,
          cancelled_at: selectedOrder.cancelled_at ?? null,
          cancel_notes : selectedOrder.cancel_notes ?? null,
        }}
        onClose={() => {
          setShowCancelRefund(false);
          setSelectedOrder(null);
        }}
        onSuccess={() => {
          setShowCancelRefund(false);
          setSelectedOrder(null);
          fetchOrders(); // refresh table
        }}
      />
    )}




    </div>
  );
}