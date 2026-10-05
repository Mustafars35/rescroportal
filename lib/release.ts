import { aggregateOrders, emptyProduction, type ProductionSnapshot } from "@/lib/production-model";

// Compatibility adapter for existing screens; the server is the only source of truth.
let snapshot:ProductionSnapshot=emptyProduction;
export const seededReleasedIds=new Set<string>();
export type ReleaseStatus="Not Released"|"Released";
export function setProductionSnapshot(value:ProductionSnapshot){snapshot=value;}
export function readReleasedIds(){return new Set(snapshot.items.map(item=>item.id));}
export function readReleasedProductionItems(){return snapshot.items;}
export function readReleasedProductionOrders(){return aggregateOrders(snapshot.items);}
export function releasedItemIdsForOrder(orderId:string){return snapshot.items.filter(item=>item.orderId===orderId).map(item=>item.id);}
export function releaseStatus(id:string,ids:Set<string>):ReleaseStatus{return ids.has(id)?"Released":"Not Released";}
async function mutate(body:unknown){
  const response=await fetch("/api/production",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  const result=await response.json();if(!response.ok)throw new Error(result.error??"Production update failed.");
  window.dispatchEvent(new Event("rescro-production-refresh"));
}
export async function releaseOrders(itemIds:string[]){await mutate({action:"release",itemIds});}
export async function returnEntireOrderToPool(orderId:string){await mutate({action:"return",orderId});}
