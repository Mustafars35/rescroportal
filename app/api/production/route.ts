import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser, hasPermission, SESSION_COOKIE } from "@/lib/auth";
import { availableStations, canCompleteStation, workStations, workStage, type WorkStation } from "@/lib/production-model";
import { productionSnapshot, releaseProduction, returnProduction, completeProduction } from "@/lib/production-server";
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
  if(user.role!=="Admin"){const releasedOrderIds=new Set(snapshot.items.map(item=>item.orderId));snapshot.orders=snapshot.orders.filter(order=>releasedOrderIds.has(order.id));}
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
  }else if(body.action==="complete"){
    if(!workStations.includes(body.station)||typeof body.itemId!=="string"||!body.itemId||body.itemId.length>200||!Number.isInteger(body.run)||body.run<1)return NextResponse.json({error:"Invalid station or item."},{status:400});
    const station=body.station as WorkStation;
    if(!availableStations(user).includes(station)||!canCompleteStation(user,station))return NextResponse.json({error:"You cannot complete this station."},{status:403});
    await completeProduction(body.itemId,station,user,body.run);
  }else return NextResponse.json({error:"Unknown action."},{status:400});
  return NextResponse.json({ok:true});
}catch(error){return failure(error);}}
