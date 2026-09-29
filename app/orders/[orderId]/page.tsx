import { notFound } from "next/navigation";
import { poolOrders } from "@/lib/order-pool";
import OrderDetailClient from "./order-detail-client";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = poolOrders.find((item) => item.id === decodeURIComponent(orderId));
  if (!order) notFound();
  return <OrderDetailClient order={order} />;
}
