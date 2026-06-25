// hooks/useCreateShipment.ts

import { useState } from 'react';
import { CreateShipmentPayload, CreateOrderShipmentResponse } from '@/types/admin_order';
import { useAuth } from '../../context/AuthContext';
import { OrderServices } from "../../services/orderServices";

interface UseCreateShipmentResult {
  loading: boolean;
  error: string | null;
  createShipment: (orderId: number, payload: CreateShipmentPayload) => Promise<CreateOrderShipmentResponse | null>;
}

export function useCreateShipment(): UseCreateShipmentResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setShowMainPageLoader } = useAuth()
  

  const createShipment = async (
    orderId: number,
    payload: CreateShipmentPayload
  ): Promise<CreateOrderShipmentResponse | null> => {
    setLoading(true);
    setError(null);
    setShowMainPageLoader(true)
    try {

      const res = await OrderServices.CreateOrderShipments(orderId,payload)
      if (res?.status === "success") {
        return res;
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

  return { loading, error, createShipment };
}
