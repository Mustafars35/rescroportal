import { poolOrders } from "@/lib/order-pool";
import type { Order } from "@/lib/orders";

export type ReleaseStatus = "Not Released" | "Released";

// New key intentionally starts the corrected item-level workflow with a clean demo state.
const storageKey = "rescro-demo-released-items-v2";
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

/** Removes only the supplied child items from production and returns them to the Pool. */
export function returnItemsToPool(itemIds: string[]) {
  const next = readReleasedIds();
  itemIds.forEach((id) => next.delete(id));
  localStorage.setItem(storageKey, JSON.stringify([...next]));
  window.dispatchEvent(new Event("rescro-release-updated"));
  return next;
}

/** Finds the currently released child items belonging to one Shopify parent order. */
export function releasedItemIdsForOrder(orderId: string): string[] {
  const released = readReleasedIds();
  const order = poolOrders.find((item) => item.id === orderId);
  return order ? order.items.filter((item) => released.has(item.id)).map((item) => item.id) : [];
}

/** Returns every released item of a parent Shopify order without deleting the order itself. */
export function returnEntireOrderToPool(orderId: string) {
  return returnItemsToPool(releasedItemIdsForOrder(orderId));
}

export function releaseStatus(id: string, releasedIds: Set<string>): ReleaseStatus {
  return releasedIds.has(id) ? "Released" : "Not Released";
}

export function readReleasedProductionItems(){
  const released=readReleasedIds();
  return poolOrders.flatMap(order=>order.items.filter(item=>released.has(item.id)).map(item=>({orderId:order.id,orderDate:order.date,customer:order.customer,...item,stage:"Waiting for Mesh" as const})));
}

/**
 * Dashboard rows represent the Shopify parent order, never individual items.
 * Individual items remain the production records used by stations and Live Production.
 */
export function readReleasedProductionOrders():Order[]{
  const grouped=new Map<string,ReturnType<typeof readReleasedProductionItems>>();
  readReleasedProductionItems().forEach(item=>{
    const existing=grouped.get(item.orderId)??[];
    existing.push(item); grouped.set(item.orderId,existing);
  });
  return [...grouped.entries()].map(([id,items])=>{
    const first=items[0];
    return {id,customer:first.customer,date:first.orderDate,store:`.${id.slice(0,2).toLowerCase()}`,stage:"Waiting for Mesh",last:"-",eta:"Upcoming 3 days",product:items.length===1?first.name:`${items.length} production items`,color:items.length===1?first.color:"Mixed",width:100,height:200,direction:"Vertical",threshold:"None",quantity:items.reduce((sum,item)=>sum+item.quantity,0),ageDays:0,stageEnteredDays:0,risk:"Normal"};
  });
}
