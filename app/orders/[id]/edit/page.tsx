"use client";

import { useParams } from "next/navigation";
import OrdersDashboard from "@/components/orders/OrdersDashboard";

export default function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  return <OrdersDashboard editOrderId={id} />;
}
