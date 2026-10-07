import { cookies } from "next/headers";
import { getSessionUser, hasPermission, SESSION_COOKIE } from "@/lib/auth";
import { availableStations, workStage } from "@/lib/production-model";
import { productionSnapshot } from "@/lib/production-server";
import { notFound } from "next/navigation";
import { poolOrders } from "@/lib/order-pool";
import OrderDetailClient from "./order-detail-client";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const user=await getSessionUser((await cookies()).get(SESSION_COOKIE)?.value);
  if(!user)notFound();
  const snapshot=await productionSnapshot();
  const order=snapshot.orders.find(item=>item.id===decodeURIComponent(orderId));
  if(!order)notFound();
  if(user.role!=="Admin"&&!hasPermission(user,"View Dashboard")&&!hasPermission(user,"View All Orders")&&!hasPermission(user,"Edit Orders")){
    const stations=availableStations(user);
    if(!hasPermission(user,"View Daily Production")||!snapshot.items.some(item=>item.orderId===order.id&&stations.some(station=>item.stage===workStage[station])))notFound();
  }
  return <OrderDetailClient order={order} />;
}
