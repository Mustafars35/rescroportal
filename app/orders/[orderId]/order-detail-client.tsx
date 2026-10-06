"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Grid3X3, Hammer, Link2, PackageOpen, Ruler, ShieldCheck, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PoolItem, PoolOrder } from "@/lib/order-pool";
import { returnEntireOrderToPool } from "@/lib/release";
import { useProduction, ProductionNotice } from "@/components/production-provider";
import { useAuth } from "@/components/auth-provider";
import { availableStations, canCompleteStation, workStage, type WorkStation, type ProductionItem } from "@/lib/production-model";
import { stages } from "@/lib/orders";
import { LegacyShell } from "@/components/legacy-shell";

const stations = [["Mesh", Grid3X3], ["Cord & Eyelet", Link2], ["Frame", Ruler], ["Assembly", Hammer], ["Quality Control", ShieldCheck], ["Packaging", PackageOpen]] as const;
type Station = (typeof stations)[number][0];
const stationColor: Record<Station, string> = { Mesh: "#c00000", "Cord & Eyelet": "#ed7d31", Frame: "#c99a00", Assembly: "#70ad47", "Quality Control": "#5b9bd5", Packaging: "#7030a0" };

type Instruction = { curtain:boolean; windowLike:boolean; pollen:boolean; width:number; height:number; piles:number; meshLength:string; cordLength:number; profileColor:string; thresholdColor:string; direction:string; closingDirection:string; montage:boolean; };

function instructionFor(item:PoolItem,index:number):Instruction { const curtain=item.name.includes("Curtain"); const height=2100+index*50; return { curtain, windowLike:item.name.includes("Window")||curtain, pollen:item.name.includes("Pollen")||index%3===1, width:900+index*100, height, piles:45+index*4, meshLength:(height/10-4.2).toFixed(1), cordLength:Math.round((900+index*100+height)/10+20), profileColor:item.color, thresholdColor:index%2?"Black":item.color, direction:index%2?"Vertical":"Horizontal", closingDirection:index%2?"Right":"Left", montage:index%4===0 }; }

function Field({label,value,emphasis=false}:{label:string;value:string;emphasis?:boolean}) {
  return <div className="detail-field" style={{minWidth:0}}>
    <dt style={{fontSize:13,fontWeight:400,letterSpacing:".01em",lineHeight:1.25}}>{label}</dt>
    <dd style={{fontSize:13,fontWeight:emphasis?700:400,lineHeight:1.35,marginTop:5,wordBreak:"break-word"}}>{value}</dd>
  </div>;
}

function StationCard({title,children}:{title:string;children:React.ReactNode}) {
  return <section className="production-section" style={{margin:0,padding:"14px 16px"}}>
    <header style={{marginBottom:14}}><h3 style={{fontSize:13,fontWeight:700,letterSpacing:".035em"}}>{title}</h3><Badge style={{fontSize:13,fontWeight:400}}>Production instruction</Badge></header>
    {children}
  </section>;
}

const compactFourColumnGrid = { display:"grid", gridTemplateColumns:"repeat(4, minmax(0, 1fr))", gap:"14px 18px", alignItems:"start" } as const;
const compactThreeColumnGrid = { display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:"14px 18px", alignItems:"start" } as const;

function FrameRows({instruction}:{instruction:Instruction}) {
  const rows=[
    ["Kanalsız Profil",`${instruction.meshLength} cm`,`2 ADET`,""],
    ["Kanallı Profil",`${instruction.meshLength} cm`,`2 ADET`,""],
    ["Kanat Profil",`${(instruction.height/10).toFixed(1)} cm`,`1 ADET`,""],
    ["Eşik Profil",`${instruction.meshLength} cm`,`1 ADET`,instruction.thresholdColor===instruction.profileColor?"":instruction.thresholdColor],
  ];
  const grid={display:"grid",gridTemplateColumns:"1.55fr 1fr .82fr .8fr",gap:12,alignItems:"center",padding:"10px 14px"} as const;
  return <div style={{border:"1px solid #e3e9ef",borderRadius:8,overflow:"hidden"}}>
    <div style={{...grid,background:"#f7f9fb",borderBottom:"1px solid #e3e9ef",color:"#64748b",fontSize:13,fontWeight:700,letterSpacing:".025em",textTransform:"uppercase"}}><span>Profil</span><span>Boy</span><span>Adet</span><span>Farklı renk</span></div>
    {rows.map(([profile,length,quantity,color],rowIndex)=><div style={{...grid,borderBottom:rowIndex<rows.length-1?"1px solid #edf1f5":undefined,color:"#334155",fontSize:13}} key={profile}>
      <strong style={{color:"#172033",fontSize:13,fontWeight:400}}>{profile}</strong><span style={{fontWeight:700}}>{length}</span><Badge variant="secondary" style={{justifySelf:"start",fontSize:13,fontWeight:700,padding:"3px 7px"}}>{quantity}</Badge><span style={{color:color?"#172033":"#94a3b8",fontSize:13}}>{color||"—"}</span>
    </div>)}
  </div>;
}

export function Instructions({item,index,onlyStation}:{item:PoolItem;index:number;onlyStation?:WorkStation}) { const data=instructionFor(item,index); const meshType=data.pollen?"POLLEN":"STANDARD"; return <div style={{display:"grid",gap:10,marginTop:12}}>
  {(!onlyStation||onlyStation==="Mesh")&&<StationCard title="MESH"><div style={compactFourColumnGrid}><div style={{borderLeft:"3px solid #374151",paddingLeft:10}}><Field label="Tül Türü" value={meshType} emphasis/></div><Field label="Pile Sayısı" value={String(data.piles)}/><Field label="Tül Boyu" value={`${data.meshLength} cm`}/><Field label="İp Boyu" value={`${data.cordLength} cm`}/>{data.curtain&&<><Field label="Perde Türü" value="Perdeli Sineklik"/><Field label="Perde Rengi" value={item.color}/></>}</div></StationCard>}
  {(!onlyStation||onlyStation==="Cord & Eyelet")&&<StationCard title="CORD & EYELET"><div style={compactFourColumnGrid}><div style={{borderLeft:"3px solid #374151",paddingLeft:10}}><Field label="İp Boyu" value={`${data.cordLength} cm`} emphasis/></div><Field label="Tül Türü" value={meshType}/><Field label="Pile Sayısı" value={String(data.piles)}/><Field label="Tül Boyu" value={`${data.meshLength} cm`}/></div></StationCard>}
  {(!onlyStation||onlyStation==="Frame")&&<StationCard title="FRAME"><div style={{marginBottom:12}}><Field label="Profil Rengi" value={data.profileColor} emphasis/></div><FrameRows instruction={data}/></StationCard>}
  {(!onlyStation||onlyStation==="Assembly")&&<StationCard title="ASSEMBLY"><div style={compactFourColumnGrid}><Field label="Ürün Rengi" value={item.color}/><Field label="Kapanma Yönü" value={data.closingDirection}/><Field label="Kapanma Türü" value="Magnetic"/><Field label="Tül Türü" value={meshType}/><Field label="Takoz / Kapak Rengi" value={data.profileColor}/><Field label="Eşik Türü" value="Standard"/>{data.windowLike&&<Field label="Ürün Yönü" value={data.direction}/>}</div></StationCard>}
  {(!onlyStation||onlyStation==="Quality Control")&&<StationCard title="QUALITY CONTROL"><div style={compactThreeColumnGrid}><div style={{borderLeft:"3px solid #374151",paddingLeft:10}}><Field label="Final Ölçü" value={`${data.width} × ${data.height} mm`} emphasis/></div><Field label="Renk" value={item.color}/><Field label="Tül Türü" value={meshType}/><Field label="Kapanma Türü" value="Magnetic"/><Field label="Kapanma Yönü" value={data.closingDirection}/>{data.windowLike&&<Field label="Ürün Yönü" value={data.direction}/>}</div></StationCard>}
  {(!onlyStation||onlyStation==="Packaging")&&<StationCard title="PACKAGING"><div style={compactThreeColumnGrid}><Field label="Ölçü" value={`${data.width} × ${data.height} mm`} emphasis/><Field label="Renk" value={item.color}/><div style={{borderLeft:"3px solid #374151",paddingLeft:10}}><Field label="Montaj" value={data.montage?"EVET – MONTAJ HİZMETİ VAR":"HAYIR – MÜŞTERİ KENDİ MONTAJ EDECEK"} emphasis/></div></div></StationCard>}
</div>; }

function Flow({production,editableStations,busy,onComplete,admin=false}:{admin?:boolean;production?:ProductionItem;editableStations:WorkStation[];busy:boolean;onComplete:(station:WorkStation,status:"complete"|"pending")=>void}) {
  return <div className="item-flow" aria-label="Production flow">{stations.map(([name,Icon],index)=>{
    const completed=Boolean(production&&(production.stage==="Finished"||(production.stage===workStage[name]&&production.stationCompleted)||stages.indexOf(production.stage)>stages.indexOf(workStage[name])));
    const active=production?.stage===workStage[name];
    const editable=Boolean(production&&editableStations.includes(name)&&((admin&&completed)||active));
    return <div className="item-flow-step" key={name}><div className="item-flow-line"><span style={{color:stationColor[name]}}><Icon/></span>{index<stations.length-1?<i/>:null}</div><strong>{name}</strong>
      <select className="station-status-control" aria-label={`${name} status for ${production?.id??"unselected item"}`} value={completed?"complete":"pending"} disabled={!editable||busy} onChange={event=>{onComplete(name,event.target.value as "complete"|"pending");}} title={editable?`Complete ${name} and advance to the next station`:completed?"This station is complete":"Waiting for previous station or read-only access"}>
        <option value="pending">Pending</option><option value="complete">Complete</option>
      </select>
    </div>;
  })}</div>;
}

export default function OrderDetailClient({order:initialOrder}:{order:PoolOrder}) { const router=useRouter(); const params=useSearchParams(); const requestedStation=params.get("station") as WorkStation|null; const {snapshot,refresh,complete}=useProduction(); const {user}=useAuth(); const order=snapshot.orders.find(value=>value.id===initialOrder.id)??initialOrder; const [editing,setEditing]=useState(false); const [draft,setDraft]=useState<PoolOrder>(initialOrder); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const released=new Set(snapshot.items.map(item=>item.id)); const workMode=params.get("mode")==="work"; const station=user&&workMode&&requestedStation&&availableStations(user).includes(requestedStation)?requestedStation:null; const editableStations=user&&(workMode||user.role==="Admin")?availableStations(user).filter(name=>canCompleteStation(user,name)):[]; const finish=async(id:string,completedStation:WorkStation,status:"complete"|"pending"="complete")=>{if(!editableStations.includes(completedStation)||busy)return;setBusy(true);setError("");try{if(status==="complete")await complete(id,completedStation);else {
 const response=await fetch("/api/production",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"pending",source:workMode?"daily-production":"dashboard",itemId:id,station:completedStation,run:snapshot.items.find(item=>item.id===id)?.run})});
 const result=await response.json();if(!response.ok)throw new Error(result.error??"Update failed");await refresh(true);
} if(status==="complete"&&user?.role!=="Admin"&&!snapshot.items.some(item=>item.orderId===order.id&&item.id!==id&&item.stage===workStage[completedStation]&&!item.stationCompleted))router.push(`/daily-production?station=${encodeURIComponent(completedStation)}`);}catch(error){setError(error instanceof Error?error.message:"Completion failed.");}finally{setBusy(false);}}; const productionItems=order.items.filter(item=>released.has(item.id)); const [firstName,lastName=""]=order.customer.split(" "); const totalQuantity=order.items.reduce((sum,item)=>sum+item.quantity,0); const returnOrder=async()=>{setBusy(true);setError("");try{await returnEntireOrderToPool(order.id);await refresh(true);}catch(error){setError(error instanceof Error?error.message:"Return failed.");}finally{setBusy(false);}}; const saveOrder=async()=>{setBusy(true);setError("");try{const response=await fetch("/api/production",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"edit",order:draft})});const result=await response.json();if(!response.ok)throw new Error(result.error??"Save failed");await refresh(true);setEditing(false);}catch(error){setError(error instanceof Error?error.message:"Save failed");}finally{setBusy(false);}}; const goBack=()=>{if(window.history.length>1)router.back();else router.push("/");}; return <LegacyShell><main className="order-detail-page"><div className="detail-container"><button type="button" className="return-link" onClick={goBack}><ArrowLeft/> Back</button><section className="order-summary"><Field label="Sipariş Numarası" value={order.id}/><Field label="Adı" value={firstName}/><Field label="Soyadı" value={lastName}/><Field label="Toplam Kalem" value={String(order.items.length)}/><Field label="Toplam Adet" value={String(totalQuantity)}/><Field label="Sipariş Tarihi" value={order.date}/></section><ProductionNotice/>{error&&<p className="auth-error" role="alert">{error}</p>}{productionItems.length>0&&user?.role==="Admin"&&<div className="item-card-toolbar"><span>Return this complete order to Order Pool.</span><button type="button" disabled={busy} onClick={()=>void returnOrder()}><Undo2/> Return Entire Order to Order Pool</button></div>}{user?.role==="Admin"&&<div className="item-card-toolbar"><button type="button" disabled={busy} onClick={()=>{setDraft(structuredClone(order));setEditing(!editing);}}>{editing?"Cancel Edit":"Edit Order"}</button>{editing&&<button type="button" disabled={busy} onClick={()=>void saveOrder()}>Save Changes</button>}</div>}{editing&&user?.role==="Admin"&&<section className="order-summary" style={{display:"grid",gap:12}}><label>Customer<input className="admin-order-input" value={draft.customer} onChange={e=>setDraft({...draft,customer:e.target.value})}/></label><label>Order Date (DD/MM/YYYY)<input className="admin-order-input" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></label>{draft.items.map((item,index)=><div key={item.id} style={{display:"grid",gap:8}}><strong>Order Item {index+1}</strong>{(["name","color","quantity"] as const).map(field=><label key={field}>{field}<input className="admin-order-input" type={field==="quantity"?"number":"text"} min={1} value={item[field]} onChange={e=>setDraft({...draft,items:draft.items.map((value,i)=>i===index?{...value,[field]:field==="quantity"?Number(e.target.value):e.target.value}:value)})}/></label>)}</div>)}</section>}<div className="items-heading"><div><h1>Order Items</h1><p>All production instructions are visible for admin review.</p></div><Badge>{order.items.length} ITEMS</Badge></div>{order.items.map((item,index)=>{const inProduction=released.has(item.id);return <article className="order-item-card" key={item.id}><header className="item-card-header"><div><span className="item-number">{index+1}</span><div><h2>Order Item {index+1} · {item.name}</h2><p>Quantity: {item.quantity} · Color: {item.color}</p></div></div><Badge className={inProduction?"current-stage":""}>{inProduction?(snapshot.items.find(production=>production.id===item.id)?.stage==="Finished"?"Finished":"In Production"):"Production Status: Not Started"}</Badge></header><Flow production={snapshot.items.find(production=>production.id===item.id)} editableStations={editableStations} busy={busy} admin={user?.role==="Admin"} onComplete={(name,status)=>void finish(item.id,name,status)}/><Instructions item={item} index={index}/></article>;})}</div></main></LegacyShell>; }
