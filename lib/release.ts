import { poolOrders } from "@/lib/order-pool";
import type { Order } from "@/lib/orders";

export type ReleaseStatus = "Not Released" | "Released";

const storageKey = "rescro-demo-released-orders";
// The first 42 records represent newly imported Shopify orders waiting for planning.
export const seededReleasedIds = new Set<string>();

export function readReleasedIds(): Set<string> {
  if (typeof window === "undefined") return seededReleasedIds;
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? new Set(JSON.parse(saved) as string[]) : new Set(seededReleasedIds);
  } catch {
    return new Set(seededReleasedIds);
  }
}

export function releaseOrders(orderIds: string[]) {
  const next = readReleasedIds();
  orderIds.forEach((id) => next.add(id));
  localStorage.setItem(storageKey, JSON.stringify([...next]));
  window.dispatchEvent(new Event("rescro-release-updated"));
  return next;
}

export function releaseStatus(id: string, releasedIds: Set<string>): ReleaseStatus {
  return releasedIds.has(id) ? "Released" : "Not Released";
}

export function readReleasedProductionItems(){
  const released=readReleasedIds();
  return poolOrders.flatMap(order=>order.items.filter(item=>released.has(item.id)).map(item=>({orderId:order.id,customer:order.customer,...item,stage:"Waiting for Mesh" as const})));
}

export function readReleasedProductionOrders():Order[]{return readReleasedProductionItems().map(item=>({id:item.orderId,customer:item.customer,date:new Date().toLocaleDateString("en-GB"),store:`.${item.orderId.slice(0,2).toLowerCase()}`,stage:"Waiting for Mesh",last:"-",eta:"Upcoming 3 days",product:item.name,color:item.color,width:100,height:200,direction:"Vertical",threshold:"None",quantity:item.quantity,ageDays:0,stageEnteredDays:0,risk:"Normal"}));}
