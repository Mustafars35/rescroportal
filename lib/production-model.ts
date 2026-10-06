import { stages, type Stage, type Order } from "@/lib/orders";
import type { PoolOrder, PoolItem } from "@/lib/order-pool";
import type { Permission, Role } from "@/lib/access";

export const workStations = ["Mesh", "Cord & Eyelet", "Frame", "Assembly", "Quality Control", "Packaging"] as const;
export type WorkStation = typeof workStations[number];
export const workStage: Record<WorkStation, Stage> = { Mesh:"Waiting for Mesh", "Cord & Eyelet":"Cord & Eyelet", Frame:"Waiting for Frame", Assembly:"Waiting for Assembly", "Quality Control":"Quality Control", Packaging:"Waiting for Packing" };
export function nextWorkStage(stage: Stage): Stage {
  const index = Object.values(workStage).indexOf(stage);
  if (index < 0) throw new Error("This stage has no employee completion action.");
  return index === 5 ? "Finished" : Object.values(workStage)[index + 1];
}
export function availableStations(user: {role:Role;permissions:Permission[]}): WorkStation[] {
  return workStations.filter(station => user.role === "Admin" || (user.role === station && user.permissions.includes("View Daily Production")) || user.permissions.includes(`View ${station}` as Permission));
}
export function canCompleteStation(user: {role:Role;permissions:Permission[]}, station: WorkStation) {
  return user.role === "Admin" || user.permissions.includes(`Complete ${station}` as Permission);
}
export type ProductionItem = PoolItem & {orderId:string;orderDate:string;customer:string;stage:Stage;releasedAt:string;stageEnteredAt:string;completedAt:string|null;run:number;stationCompleted?:boolean};
export type ProductionEvent = {id:string;orderId:string;itemId:string|null;station:Stage;action:"released"|"completed"|"returned";quantity:number;userId:string|null;userName:string;at:string;run:number};
export type ProductionSnapshot = {orders:PoolOrder[];items:ProductionItem[];events:ProductionEvent[];updatedAt:string};
export const emptyProduction:ProductionSnapshot = {orders:[],items:[],events:[],updatedAt:""};
export function dateKey(value:string|Date = new Date()) { return new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Istanbul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value)); }
export function aggregateOrders(items:ProductionItem[]):Order[] {
  const groups=new Map<string,ProductionItem[]>();
  for(const item of items) groups.set(item.orderId,[...(groups.get(item.orderId)??[]),item]);
  return [...groups].map(([id,children])=>{
    const stage=stages.find(stage=>children.some(item=>item.stage===stage))!;
    const current=children.filter(item=>item.stage===stage);
    const first=children[0]; const now=Date.now();
    const days=(at:string)=>Math.max(0,Math.floor((now-new Date(at).getTime())/86400000));
    const ageDays=Math.max(...children.map(item=>days(item.releasedAt)));
    const stageEnteredDays=Math.max(...current.map(item=>days(item.stageEnteredAt)));
    const previous=stages[stages.indexOf(stage)-1];
    return {id,customer:first.customer,date:first.orderDate,store:`.${id.slice(0,2).toLowerCase()}`,stage,last:previous?`${previous.replace("Waiting for ","")} completed`:"Not started yet",eta:stage==="Finished"?"Finished":"In production",product:children.length===1?first.name:`${children.length} production items`,color:children.length===1?first.color:"Mixed",width:100,height:200,direction:"Vertical" as const,threshold:"None",quantity:children.reduce((sum,item)=>sum+item.quantity,0),ageDays,stageEnteredDays,risk:stage!=="Finished"&&ageDays>7?"Delayed" as const:"Normal" as const};
  });
}
export function completedOrderDate(items:ProductionItem[]):string|null { return items.length && items.every(item=>item.stage==="Finished"&&item.completedAt) ? dateKey(items.map(item=>item.completedAt!).sort().at(-1)!) : null; }
export function stationTotals(events:ProductionEvent[],start:string,end:string) {
  return stages.map(stage=>({stage,value:events.filter(event=>event.action==="completed"&&event.station===stage&&dateKey(event.at)>=start&&dateKey(event.at)<=end).reduce((sum,event)=>sum+event.quantity,0)}));
}

export type DashboardOrder = Omit<Order,"stage"> & {stage:Stage|"Not Started"};
export function dashboardOrders(snapshot:ProductionSnapshot):DashboardOrder[] {
  const active=new Map(aggregateOrders(snapshot.items).map(order=>[order.id,order]));
  return snapshot.orders.map(order=>active.get(order.id)??{
    id:order.id,customer:order.customer,date:order.date,store:`.${order.id.slice(0,2).toLowerCase()}`,
    stage:"Not Started",last:"—",eta:"—",product:order.items.length===1?order.items[0].name:`${order.items.length} items`,
    color:order.items.length===1?order.items[0].color:"Mixed",width:0,height:0,direction:"Vertical",threshold:"None",
    quantity:order.items.reduce((sum,item)=>sum+item.quantity,0),ageDays:0,stageEnteredDays:0,risk:"Normal"
  });
}
