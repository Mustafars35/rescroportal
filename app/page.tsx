"use client";
import {useI18n,LanguageSelector} from "@/components/i18n-provider";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Activity, BarChart3, Box, Boxes, CheckCircle2, ChevronLeft, ChevronRight,
  CircleGauge, ClipboardList, Clock3, Eye, Factory, FileClock,
  Filter, Frame, Hammer, LayoutDashboard, Menu,
  MoreHorizontal, PackageCheck, Plus, RefreshCw, Search, Settings,
  ShieldCheck, UserRound, UsersRound, Grid3X3, Link2, PackageOpen, Wrench, Warehouse, Truck, Gauge,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orders, stages as flow, type Stage } from "@/lib/orders";
import { useProduction, ProductionNotice } from "@/components/production-provider";
import { completedOrderDate, dashboardOrders } from "@/lib/production-model";
import { completionEstimate } from "@/lib/completion-estimate";
import { useAuth } from "@/components/auth-provider";

const stageConfig:Record<Stage,{color:string;soft:string;icon:typeof Clock3}> = {
  "Waiting for Mesh":{color:"#C00000",soft:"#ffffff",icon:Grid3X3},
  "Cord & Eyelet":{color:"#ED7D31",soft:"#ffffff",icon:Link2},
  "Waiting for Frame":{color:"#C99A00",soft:"#ffffff",icon:Frame},
  "Waiting for Assembly":{color:"#70AD47",soft:"#ffffff",icon:Hammer},
  "Quality Control":{color:"#5B9BD5",soft:"#ffffff",icon:ShieldCheck},
  "Waiting for Packing":{color:"#4472C4",soft:"#ffffff",icon:Box},
  "Packed":{color:"#7030A0",soft:"#ffffff",icon:PackageCheck},
  "Finished":{color:"#C55A8C",soft:"#ffffff",icon:CheckCircle2},
};

const visibleFlow = flow.filter(stage => stage !== "Finished" && stage !== "Packed");

const flowLabels: Record<Stage, string> = {
  "Waiting for Mesh": "Mesh",
  "Cord & Eyelet": "Cord & Eyelet",
  "Waiting for Frame": "Frame",
  "Waiting for Assembly": "Assembly",
  "Quality Control": "Quality",
  "Waiting for Packing": "Packing",
  "Packed": "Packed",
  "Finished": "Finished",
};

const nav = [
  [LayoutDashboard,"Dashboard","/"],
  [Factory,"Daily Production","/daily-production"],
  [Factory,"Fabrika Talepleri","/factory-requests"],
  [Activity,"Delayed & Risk","/delayed-risk"],
  [Truck,"Shipping","/shipping"],
  [Warehouse,"Stock Management","/stock-management"],
  [BarChart3,"Production Overview","/production-overview"],
  [Gauge,"Live Production","/live-production"],
  [Factory,"Factory Control Center","/factory-control-center"],
  [FileClock,"Audit Logs","/audit-logs"],
  [UserRound,"User Management","/user-management"],
  [Settings,"Settings","/"]
] as const;
function MetricCard({label,value,hint,percent,color,icon:Icon}:{label:string;value:number;hint:string;percent:number;color:string;icon:typeof Box}) { const {t,locale,formatDate} = useI18n(); 
  return <Card className="metric-card">
    <div className="metric-top"><div className="metric-icon" style={{color,background:`${color}12`}}><Icon/></div>
      <div><p>{t(label)}</p><strong style={{color}}>{value.toLocaleString(locale)}</strong><span>{t(hint)}</span></div>
    </div>
    <div className="metric-progress"><Progress value={percent} style={{color}}/><b>{percent.toFixed(1)}%</b></div>
  </Card>;
}

function StageBadge({stage}:{stage:Stage|"Not Started"}) { const {t,locale,formatDate} = useI18n(); 
  if(stage==="Not Started")return <Badge variant="secondary" className="stage-badge" style={{color:"#374151",background:"#f1f5f9"}}><Clock3/> {t(" Not Started")}</Badge>;
  const config=stageConfig[stage]; const Icon=config.icon;
  return <Badge className="stage-badge" style={{color:config.color,background:config.soft}}><Icon/>{t(stage)}</Badge>;
}

function RiskBadge({risk}:{risk:"Normal"|"Risk"|"Delayed"}) { const {t,locale,formatDate} = useI18n();  return <Badge className={`risk-badge ${risk.toLowerCase()}`}><i/>{t(risk)}</Badge>; }

export default function Home() { const {t,locale,formatDate} = useI18n(); 
  const {user,can,logout}=useAuth();
  const {snapshot}=useProduction(); const [completedTodayOnly,setCompletedTodayOnly]=useState(false);
  const [query,setQuery]=useState(""); const [store,setStore]=useState("all"); const [stage,setStage]=useState("all"); const [productionOnly,setProductionOnly]=useState(false);
  const [selected,setSelected]=useState<string[]>([]);
  const productionOrders=useMemo(()=>dashboardOrders(snapshot),[snapshot]);
  const filtered=useMemo(()=>productionOrders.filter(o=>
    `${o.id} ${o.customer} ${o.stage} ${t(o.stage)}`.toLowerCase().includes(query.toLowerCase()) &&
    (store==="all"||o.store===store) && (stage==="all"||o.stage===stage) && (!productionOnly || (o.stage!=="Finished"&&o.stage!=="Not Started")) && (!completedTodayOnly || completedOrderDate(snapshot.items.filter(item=>item.orderId===o.id))===new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Istanbul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()))
  ),[query,store,stage,productionOnly,productionOrders,snapshot,completedTodayOnly,t]);
  const finished=productionOrders.filter(o=>o.stage==="Finished").length;
  const notStarted=productionOrders.filter(o=>o.stage==="Not Started").length;
  const production=productionOrders.length-finished-notStarted; const pct=(v:number)=>productionOrders.length?v/productionOrders.length*100:0;
  const allSelected=filtered.length>0&&filtered.every(o=>selected.includes(o.id));
  const toggleAll=()=>setSelected(allSelected?selected.filter(id=>!filtered.some(o=>o.id===id)):Array.from(new Set([...selected,...filtered.map(o=>o.id)])));


  useEffect(()=>{const params=new URLSearchParams(window.location.search);const requested=params.get("stage");if(requested && flow.includes(requested as Stage))setStage(requested);if(params.get("view")==="in-production")setProductionOnly(true);if(params.get("view")==="completed-today")setCompletedTodayOnly(true);if(params.has("stage")||params.get("view")){requestAnimationFrame(()=>document.getElementById("orders-table")?.scrollIntoView({behavior:"smooth",block:"start"}));}},[]);

  useEffect(()=>{
    const context=(document as Document & {modelContext?:{registerTool:(tool:unknown,options?:{signal?:AbortSignal})=>void|Promise<void>}}).modelContext;
    if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    const report=(error:unknown)=>console.warn("WebMCP registration failed",error);
    void Promise.resolve(context.registerTool({
      name:"filter_orders",title:"Filter production orders",
      description:"Filter the visible RESCRO order table by search text, store, or production stage.",
      inputSchema:{type:"object",properties:{query:{type:"string"},store:{type:"string"},stage:{type:"string"}},additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      execute(input:unknown){
        const value=(input&&typeof input==="object"?input:{}) as {query?:unknown;store?:unknown;stage?:unknown};
        if(value.query!==undefined&&typeof value.query!=="string")throw new Error("query must be a string");
        if(value.store!==undefined&&typeof value.store!=="string")throw new Error("store must be a string");
        if(value.stage!==undefined&&typeof value.stage!=="string")throw new Error("stage must be a string");
        if(typeof value.query==="string")setQuery(value.query);
        if(typeof value.store==="string")setStore(value.store);
        if(typeof value.stage==="string")setStage(value.stage);
        return {status:"filters_applied"};
      }
    },{signal:lifecycle.signal})).catch(report);
    void Promise.resolve(context.registerTool({
      name:"open_order_details",title:"Open order details",
      description:"Open the visible production and calculation details for one RESCRO order.",
      inputSchema:{type:"object",properties:{orderId:{type:"string"}},required:["orderId"],additionalProperties:false},
      annotations:{readOnlyHint:true,untrustedContentHint:false},
      execute(input:unknown){
        const orderId=(input as {orderId?:unknown})?.orderId;
        if(typeof orderId!=="string")throw new Error("orderId must be a string");
        const order=productionOrders.find(item=>item.id===orderId);
        if(!order)throw new Error("Order not found");
        window.location.assign(`/orders/${encodeURIComponent(order.id)}`);
        return {orderId:order.id,stage:order.stage,product:order.product};
      }
    },{signal:lifecycle.signal})).catch(report);
    return()=>lifecycle.abort();
  },[productionOrders]);

  return <SidebarProvider style={{"--sidebar-width":"13.2rem"} as React.CSSProperties}>
    <Sidebar collapsible="offcanvas" className="rescro-sidebar">
      <SidebarHeader className="brand"><Link href="/"><Image src="/rescro-logo.png" alt="RESCRO" width={166} height={52} priority/></Link></SidebarHeader>
      <SidebarContent><SidebarGroup><SidebarGroupContent><SidebarMenu>
        {nav.filter(([,label])=>label==="Fabrika Talepleri"?(can("View Factory Requests")||user?.role==="Customer Service"):label==="Dashboard"?can("View Dashboard"):label==="Daily Production"||label==="Live Production"||label==="Production Overview"||label==="Delayed & Risk"?can("View Daily Production"):label==="Stock Management"?can("View Stock"):label==="Shipping"?can("View Shipping"):label==="Factory Control Center"?user?.role==="Admin":label==="Audit Logs"?can("View Audit Logs"):label==="User Management"||label==="Settings"?can("Manage Users & Roles"):false).map(([Icon,label,href])=><SidebarMenuItem key={label}><SidebarMenuButton asChild isActive={label==="Dashboard"} tooltip={t(label)}><Link href={href}><Icon/><span>{t(label)}</span></Link></SidebarMenuButton></SidebarMenuItem>)}
      </SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent>
      <SidebarFooter><button className="profile auth-profile" onClick={()=>void logout()} title={t("Log out")}><span><UserRound/></span><span><b>{user?.name ?? t("Account")}</b><small>{t(user?.role) ?? ""} {t(" · Log out")}</small></span><ChevronRight/></button></SidebarFooter>
    </Sidebar>

    <SidebarInset><main className="portal-shell">
      <header className="topbar mb-6">
        <div className="title-wrap"><SidebarTrigger className="mobile-trigger"><Menu/></SidebarTrigger><div><h1>{t("Orders Overview")}</h1></div></div>
        <div className="top-actions"><Button variant="outline"><RefreshCw/> {t(" Sync Store")}</Button><Button variant="outline"><FileClock/> {t(" Audit Logs")}</Button>{user?.role==="Admin"&&<Button className="create"><Plus/> {t(" Create Order")}</Button>}<LanguageSelector/><Button variant="outline" size="icon" className="round"><UserRound/></Button></div>
      </header>
      {selected.length>0&&<section className="export-row"><span className="selected-count">{selected.length} {t(" order")}{selected.length>1 ? t("s") : ""} {t(" selected")}</span></section>}
      <section className="metrics">
        <MetricCard label={t("TOTAL ORDERS")} value={productionOrders.length} hint={t("All orders in system")} percent={pct(finished)} color="#161616" icon={Box}/>
        <MetricCard label={t("NOT STARTED ORDERS")} value={notStarted} hint={t("Waiting in Order Pool")} percent={pct(notStarted)} color="#353535" icon={Clock3}/>
        <MetricCard label={t("ORDERS IN PRODUCTION")} value={production} hint={t("Including Packed")} percent={pct(production)} color="#515151" icon={CircleGauge}/>
        <MetricCard label={t("FINISHED ORDERS")} value={finished} hint={t("Production completed")} percent={pct(finished)} color="#707070" icon={CheckCircle2}/>
      </section>
      <Card className="flow-card">
        <div className="section-heading"><div><h2>{t("PRODUCTION FLOW")}</h2><p>{t("Track orders as they move through the production process")}</p></div><Activity/></div>
        <div className="flow">{visibleFlow.map((item,index)=>{const config=stageConfig[item];const Icon=config.icon;return <button type="button" className={`flow-step${stage===item?" active":""}`} key={item} onClick={()=>{setStage(item);requestAnimationFrame(()=>document.getElementById("orders-table")?.scrollIntoView({behavior:"smooth",block:"start"}))}} aria-label={t("Show {0} orders", {0: flowLabels[item]})}>
          <div className="flow-visual"><span style={{color:config.color,background:config.soft}}><Icon/></span>{index<visibleFlow.length-1&&<i/>}</div><b>{index+1}</b><strong>{t(flowLabels[item])}</strong><small>{productionOrders.filter(order=>order.stage===item).length}</small>
        </button>})}</div>
        
      </Card>
      <ProductionNotice/><Card className="orders-card" id="orders-table">
        <div className="filters">
          <label><span>{t("Search Order")}</span><div className="search"><Search/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Search by order, customer or status...")}/></div></label>
          <label><span>{t("Store")}</span><Select value={store} onValueChange={setStore}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">{t("All stores")}</SelectItem>{[".nl",".de",".fr",".dk",".uk",".es",".pl"].map(s=><SelectItem key={s} value={s}>{t(s)}</SelectItem>)}</SelectContent></Select></label>
          <label><span>{t("Status")}</span><Select value={stage} onValueChange={setStage}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">{t("All statuses")}</SelectItem><SelectItem value="Not Started">{t("Not Started")}</SelectItem>{flow.map(s=><SelectItem key={s} value={s}>{t(s)}</SelectItem>)}</SelectContent></Select></label>
          <Button variant="outline" className="filter-button"><Filter/> {t(" Filters")}</Button>
          <Button variant="ghost" onClick={()=>{setQuery("");setStore("all");setStage("all");setProductionOnly(false);setCompletedTodayOnly(false)}}><RefreshCw/> {t(" Reset")}</Button>
        </div>
        <div className="table-wrap"><Table>
          <TableHeader><TableRow><TableHead><Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label={t("Select all visible orders")}/></TableHead><TableHead>{t("Order Number")}</TableHead><TableHead>{t("Customer")}</TableHead><TableHead>{t("Order Date")}</TableHead><TableHead>{t("Store")}</TableHead><TableHead>{t("Status / Stage")}</TableHead><TableHead>{t("Risk")}</TableHead><TableHead>{t("Last Completed Stage")}</TableHead><TableHead>{t("Tahmini Tamamlanma Süresi")}</TableHead><TableHead className="text-right">{t("Actions")}</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map(order=><TableRow key={order.id} data-state={selected.includes(order.id)?"selected":undefined}>
            <TableCell><Checkbox checked={selected.includes(order.id)} onCheckedChange={()=>setSelected(current=>current.includes(order.id)?current.filter(id=>id!==order.id):[...current,order.id])} aria-label={t("Select {0}", {0: order.id})}/></TableCell>
            <TableCell className="order-id">{order.id}</TableCell><TableCell>{order.customer}</TableCell><TableCell>{formatDate(order.date)}</TableCell><TableCell><Badge variant="secondary">{order.store}</Badge></TableCell><TableCell><StageBadge stage={order.stage}/></TableCell><TableCell><RiskBadge risk={order.risk}/></TableCell>
            <TableCell><span className="last-stage" style={{"--dot":(order.stage==="Not Started"?"#707070":stageConfig[order.stage].color)} as React.CSSProperties}>{t(order.last)}</span></TableCell><TableCell><Badge variant="outline" className="eta">{t(completionEstimate(order.date, order.stage === "Finished"))}</Badge></TableCell>
            <TableCell><div className="row-actions"><Link className="view-order-link" href={`/orders/${encodeURIComponent(order.id)}`}><Eye/> {t(" View Order")}</Link><Button variant="ghost" size="icon"><MoreHorizontal/></Button></div></TableCell>
          </TableRow>)}</TableBody>
        </Table>{filtered.length===0&&<div className="empty"><Search/><b>{t("No orders found")}</b><span>{t("Try changing your search or filters.")}</span></div>}</div>
        <footer className="pagination"><span>{t("Showing ")}{filtered.length} {t(" of ")}{productionOrders.length} {t(" orders")}</span><div><Button variant="outline" size="icon"><ChevronLeft/></Button><Button className="page-active">1</Button><Button variant="outline">2</Button><Button variant="outline" size="icon"><ChevronRight/></Button></div></footer>
      </Card>
    </main></SidebarInset>

  </SidebarProvider>;
}
