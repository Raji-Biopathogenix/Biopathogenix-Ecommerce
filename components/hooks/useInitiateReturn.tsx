
import { useState } from 'react';
import { ReturnPayload, CreateOrderShipmentResponse,ReturnResponse } from '@/types/admin_order';
import { useAuth } from '../../context/AuthContext';
import { OrderServices } from "../../services/orderServices";

interface UseInitiateReturnResult {
  loading: boolean;
  error: string | null;
  initiateReturn: (orderId: number, payload: ReturnPayload) => Promise<ReturnResponse | null>;
}

export function useInitiateReturn(): UseInitiateReturnResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setShowMainPageLoader } = useAuth()

  const initiateReturn = async (
    orderId: number,
    payload: ReturnPayload
  ): Promise<ReturnResponse | null> => {
    setLoading(true);
    setError(null);
    setShowMainPageLoader(true)
    try {

      const res = await OrderServices.ReturnOrderInitiate(orderId,payload)
      if (res?.status === "success") {
        return res?.data as ReturnResponse;
      }
      return null;
    } catch(error: any){
      setError(error?.message);
      return null;
    } finally {
      setShowMainPageLoader(false)
      setLoading(false);
    }
  };

  return { loading, error, initiateReturn };
}
