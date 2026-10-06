import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser, hasPermission, SESSION_COOKIE } from "@/lib/auth";
import { availableStations, canCompleteStation, workStations, workStage, type WorkStation } from "@/lib/production-model";
import { productionSnapshot, releaseProduction, returnProduction, completeProduction, pendingProduction, editProductionOrder } from "@/lib/production-server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const actor=async()=>getSessionUser((await cookies()).get(SESSION_COOKIE)?.value);
const failure=(error:unknown)=>{const text=error instanceof Error?error.message:"";if(text.startsWith("CONFLICT:"))return NextResponse.json({error:text.slice(9).trim()},{status:409});console.error("Production request failed",error);return NextResponse.json({error:"Production service unavailable. No local changes were saved."},{status:503});};
export async function GET(){try{
  const user=await actor();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
  const stations=availableStations(user);
  const global=user.role==="Admin"||hasPermission(user,"View Dashboard")||hasPermission(user,"View All Orders");
  if(!global&&!stations.length&&!hasPermission(user,"View Daily Production"))return NextResponse.json({error:"Permission denied."},{status:403});
  const snapshot=await productionSnapshot();
  if(!global){
    const ids=new Set(snapshot.items.filter(item=>stations.some(station=>workStage[station]===item.stage)).map(item=>item.orderId));
    snapshot.orders=snapshot.orders.filter(order=>ids.has(order.id));
    snapshot.items=snapshot.items.filter(item=>ids.has(item.orderId));
    snapshot.events=snapshot.events.filter(event=>ids.has(event.orderId));
  }
  return NextResponse.json(snapshot,{headers:{"Cache-Control":"no-store"}});
}catch(error){return failure(error);}}
export async function POST(request:Request){try{
  const user=await actor();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
  // All writes are same-origin and JSON. A foreign site cannot issue a credentialed write.
  const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin."},{status:403});
  if(!request.headers.get("content-type")?.includes("application/json"))return NextResponse.json({error:"JSON required."},{status:415});
  const body=await request.json();
  if(body.action==="release"){
    if(user.role!=="Admin")return NextResponse.json({error:"Only Admin can manage the Order Pool."},{status:403});
    if(!Array.isArray(body.itemIds)||!body.itemIds.length||body.itemIds.length>2000||body.itemIds.some((id:unknown)=>typeof id!=="string"||id.length>200))return NextResponse.json({error:"Select valid production items."},{status:400});
    const ids=[...new Set(body.itemIds)] as string[];await releaseProduction(ids,user);
  }else if(body.action==="return"){
    if(user.role!=="Admin")return NextResponse.json({error:"Only Admin can return an order."},{status:403});
    if(typeof body.orderId!=="string"||!body.orderId||body.orderId.length>200)return NextResponse.json({error:"Invalid order."},{status:400});
    await returnProduction(body.orderId,user);
  }else if(body.action==="edit"){
    if(user.role!=="Admin")return NextResponse.json({error:"Only Admin can edit orders."},{status:403});
    const order=body.order;
    if(!order||typeof order.id!=="string"||typeof order.customer!=="string"||!order.customer.trim()||order.customer.length>200||typeof order.date!=="string"||!/^\d{2}\/\d{2}\/\d{4}$/.test(order.date)||!Array.isArray(order.items)||!order.items.length||order.items.length>100||new Set(order.items.map((i:{id:string})=>i.id)).size!==order.items.length||order.items.some((i:{id:string;name:string;color:string;quantity:number;manufactured:boolean})=>typeof i.id!=="string"||typeof i.name!=="string"||!i.name.trim()||i.name.length>200||/easyclick/i.test(i.name)||typeof i.color!=="string"||i.color.length>100||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>10000||i.manufactured!==true))return NextResponse.json({error:"Invalid order details."},{status:400});
    await editProductionOrder(order,user);
  }else if(body.action==="complete"||body.action==="pending"){
    if(user.role!=="Admin"&&body.source!=="daily-production")return NextResponse.json({error:"Use Daily Production for station updates."},{status:403});
    if(!workStations.includes(body.station)||typeof body.itemId!=="string"||!body.itemId||body.itemId.length>200||!Number.isInteger(body.run)||body.run<1)return NextResponse.json({error:"Invalid station or item."},{status:400});
    const station=body.station as WorkStation;
    if(!availableStations(user).includes(station)||!canCompleteStation(user,station))return NextResponse.json({error:"You cannot complete this station."},{status:403});
    if(body.action==="pending")await pendingProduction(body.itemId,station,user,body.run);else await completeProduction(body.itemId,station,user,body.run);
  }else return NextResponse.json({error:"Unknown action."},{status:400});
  return NextResponse.json({ok:true});
}catch(error){return failure(error);}}
