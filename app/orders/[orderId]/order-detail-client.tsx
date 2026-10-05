"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Grid3X3, Hammer, Link2, PackageOpen, Ruler, ShieldCheck, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PoolItem, PoolOrder } from "@/lib/order-pool";
import { readReleasedIds, returnEntireOrderToPool } from "@/lib/release";
import { useProduction, ProductionNotice } from "@/components/production-provider";
import { useAuth } from "@/components/auth-provider";
import { workStage, type WorkStation, type ProductionItem } from "@/lib/production-model";
import { stages } from "@/lib/orders";
import { LegacyShell } from "@/components/legacy-shell";

const stations = [["Mesh", Grid3X3], ["Cord & Eyelet", Link2], ["Frame", Ruler], ["Assembly", Hammer], ["Quality Control", ShieldCheck], ["Packaging", PackageOpen]] as const;
type Station = (typeof stations)[number][0];
const stationColor: Record<Station, string> = { Mesh: "#c00000", "Cord & Eyelet": "#ed7d31", Frame: "#c99a00", Assembly: "#70ad47", "Quality Control": "#5b9bd5", Packaging: "#7030a0" };

type Instruction = { curtain:boolean; windowLike:boolean; pollen:boolean; width:number; height:number; piles:number; meshLength:string; cordLength:number; profileColor:string; thresholdColor:string; direction:string; closingDirection:string; montage:boolean; };

function instructionFor(item:PoolItem,index:number):Instruction { const curtain=item.name.includes("Curtain"); const height=2100+index*50; return { curtain, windowLike:item.name.includes("Window")||curtain, pollen:item.name.includes("Pollen")||index%3===1, width:900+index*100, height, piles:45+index*4, meshLength:(height/10-4.2).toFixed(1), cordLength:Math.round((900+index*100+height)/10+20), profileColor:item.color, thresholdColor:index%2?"Black":item.color, direction:index%2?"Vertical":"Horizontal", closingDirection:index%2?"Right":"Left", montage:index%4===0 }; }

function Field({label,value,emphasis=false}:{label:string;value:string;emphasis?:boolean}) {
  return <div className="detail-field" style={{minWidth:0}}>
    <dt style={{fontSize:11,fontWeight:600,letterSpacing:".01em",lineHeight:1.25}}>{label}</dt>
    <dd style={{fontSize:emphasis?16:14,fontWeight:emphasis?800:700,lineHeight:1.35,marginTop:5,wordBreak:"break-word"}}>{value}</dd>
  </div>;
}

function StationCard({title,children}:{title:string;children:React.ReactNode}) {
  return <section className="production-section" style={{margin:0,padding:"14px 16px"}}>
    <header style={{marginBottom:14}}><h3 style={{fontSize:14,fontWeight:800,letterSpacing:".035em"}}>{title}</h3><Badge style={{fontSize:10,fontWeight:650}}>Production instruction</Badge></header>
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
    <div style={{...grid,background:"#f7f9fb",borderBottom:"1px solid #e3e9ef",color:"#64748b",fontSize:10,fontWeight:750,letterSpacing:".025em",textTransform:"uppercase"}}><span>Profil</span><span>Boy</span><span>Adet</span><span>Farklı renk</span></div>
    {rows.map(([profile,length,quantity,color],rowIndex)=><div style={{...grid,borderBottom:rowIndex<rows.length-1?"1px solid #edf1f5":undefined,color:"#334155",fontSize:13}} key={profile}>
      <strong style={{color:"#172033",fontSize:13,fontWeight:700}}>{profile}</strong><span style={{fontWeight:700}}>{length}</span><Badge variant="secondary" style={{justifySelf:"start",fontSize:10,fontWeight:750,padding:"3px 7px"}}>{quantity}</Badge><span style={{color:color?"#172033":"#94a3b8",fontSize:12}}>{color||"—"}</span>
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

function Flow({production}:{production?:ProductionItem}) { return <div className="item-flow" aria-label="Production flow">{stations.map(([name,Icon],index)=>{const complete=production&&(production.stage==="Finished"||stages.indexOf(production.stage)>stages.indexOf(workStage[name]));const active=production?.stage===workStage[name];return <div className="item-flow-step" key={name}><div className="item-flow-line"><span style={{color:stationColor[name]}}><Icon/></span>{index<stations.length-1?<i/>:null}</div><strong>{name}</strong><Badge variant="secondary">{complete?"Completed":active?"In Progress":"Pending"}</Badge></div>})}</div>; }

export default function OrderDetailClient({order}:{order:PoolOrder}) { const router=useRouter(); const {snapshot,refresh}=useProduction(); const {user}=useAuth(); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [released,setReleased]=useState<Set<string>>(()=>new Set()); useEffect(()=>{const sync=()=>setReleased(readReleasedIds());sync();window.addEventListener("rescro-release-updated",sync);return()=>window.removeEventListener("rescro-release-updated",sync);},[]); const productionItems=order.items.filter(item=>released.has(item.id)); const [firstName,lastName=""]=order.customer.split(" "); const totalQuantity=order.items.reduce((sum,item)=>sum+item.quantity,0); const returnOrder=async()=>{setBusy(true);setError("");try{await returnEntireOrderToPool(order.id);await refresh(true);setReleased(readReleasedIds());}catch(error){setError(error instanceof Error?error.message:"Return failed.");}finally{setBusy(false);}}; const goBack=()=>{if(window.history.length>1)router.back();else router.push("/");}; return <LegacyShell><main className="order-detail-page"><div className="detail-container"><button type="button" className="return-link" onClick={goBack}><ArrowLeft/> Back</button><section className="order-summary"><Field label="Sipariş Numarası" value={order.id}/><Field label="Adı" value={firstName}/><Field label="Soyadı" value={lastName}/><Field label="Toplam Kalem" value={String(order.items.length)}/><Field label="Toplam Adet" value={String(totalQuantity)}/><Field label="Sipariş Tarihi" value={order.date}/></section><ProductionNotice/>{error&&<p className="auth-error" role="alert">{error}</p>}{productionItems.length>0&&user?.role==="Admin"&&<div className="item-card-toolbar"><span>Return this complete order to Order Pool.</span><button type="button" disabled={busy} onClick={()=>void returnOrder()}><Undo2/> Return Entire Order to Order Pool</button></div>}<div className="items-heading"><div><h1>Order Items</h1><p>All production instructions are visible for admin review.</p></div><Badge>{order.items.length} ITEMS</Badge></div>{order.items.map((item,index)=>{const inProduction=released.has(item.id);return <article className="order-item-card" key={item.id}><header className="item-card-header"><div><span className="item-number">{index+1}</span><div><h2>Order Item {index+1} · {item.name}</h2><p>Quantity: {item.quantity} · Color: {item.color}</p></div></div><Badge className={inProduction?"current-stage":""}>{inProduction?(snapshot.items.find(production=>production.id===item.id)?.stage==="Finished"?"Finished":"In Production"):"Not Selected"}</Badge></header><Flow production={snapshot.items.find(production=>production.id===item.id)}/><Instructions item={item} index={index}/></article>;})}</div></main></LegacyShell>; }
