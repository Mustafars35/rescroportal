"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, BarChart3, Box, Boxes, CheckCircle2, ChevronLeft, ChevronRight,
  CircleGauge, ClipboardList, Clock3, Download, Eye, Factory, FileClock,
  FileSpreadsheet, Filter, Frame, Globe2, Hammer, LayoutDashboard, Menu,
  MoreHorizontal, PackageCheck, Plus, RefreshCw, Search, Settings,
  ShieldCheck, UserRound, UsersRound,
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

const stageConfig:Record<Stage,{color:string;soft:string;icon:typeof Clock3}> = {
  "Waiting for Mesh":{color:"#f07b12",soft:"#fff4e8",icon:Clock3},
  "Waiting for Frame":{color:"#7338e6",soft:"#f3edff",icon:Frame},
  "Waiting for Assembly":{color:"#1769e0",soft:"#edf5ff",icon:Hammer},
  "Quality Control":{color:"#0a958f",soft:"#e9fbf8",icon:ShieldCheck},
  "Waiting for Packing":{color:"#e87512",soft:"#fff3e8",icon:Box},
  "Packed":{color:"#16a34a",soft:"#eaf9ef",icon:PackageCheck},
  "Finished":{color:"#6d28d9",soft:"#f3edff",icon:CheckCircle2},
};

const nav = [[LayoutDashboard,"Dashboard"],[ClipboardList,"Orders"],[Factory,"Production"],[Boxes,"Products"],[UsersRound,"Customers"],[BarChart3,"Reports"],[FileClock,"Audit Logs"],[UserRound,"User Management"],[Settings,"Settings"]] as const;
const lastLabel:Record<Stage,string> = {
  "Waiting for Mesh":"Not started yet","Waiting for Frame":"Mesh completed",
  "Waiting for Assembly":"Frame completed","Quality Control":"Assembly completed",
  "Waiting for Packing":"QC completed",Packed:"Packed & ready",Finished:"Manually finished by admin",
};

function MetricCard({label,value,hint,percent,color,icon:Icon}:{label:string;value:number;hint:string;percent:number;color:string;icon:typeof Box}) {
  return <Card className="metric-card">
    <div className="metric-top"><div className="metric-icon" style={{color,background:`${color}12`}}><Icon/></div>
      <div><p>{label}</p><strong style={{color}}>{value.toLocaleString("en-US")}</strong><span>{hint}</span></div>
    </div>
    <div className="metric-progress"><Progress value={percent} style={{color}}/><b>{percent.toFixed(1)}%</b></div>
  </Card>;
}

function StageBadge({stage}:{stage:Stage}) {
  const config=stageConfig[stage]; const Icon=config.icon;
  return <Badge className="stage-badge" style={{color:config.color,background:config.soft}}><Icon/>{stage}</Badge>;
}

export default function Home() {
  const [query,setQuery]=useState(""); const [store,setStore]=useState("all"); const [stage,setStage]=useState("all");
  const [selected,setSelected]=useState<string[]>([]);
  const filtered=useMemo(()=>orders.filter(o=>
    `${o.id} ${o.customer}`.toLowerCase().includes(query.toLowerCase()) &&
    (store==="all"||o.store===store) && (stage==="all"||o.stage===stage)
  ),[query,store,stage]);
  const finished=orders.filter(o=>o.stage==="Finished").length;
  const notStarted=orders.filter(o=>o.stage==="Waiting for Mesh").length;
  const production=orders.length-finished-notStarted; const pct=(v:number)=>v/orders.length*100;
  const allSelected=filtered.length>0&&filtered.every(o=>selected.includes(o.id));
  const toggleAll=()=>setSelected(allSelected?selected.filter(id=>!filtered.some(o=>o.id===id)):Array.from(new Set([...selected,...filtered.map(o=>o.id)])));

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
        const order=orders.find(item=>item.id===orderId);
        if(!order)throw new Error("Order not found");
        window.location.assign(`/orders/${encodeURIComponent(order.id)}`);
        return {orderId:order.id,stage:order.stage,product:order.product};
      }
    },{signal:lifecycle.signal})).catch(report);
    return()=>lifecycle.abort();
  },[]);

  return <SidebarProvider style={{"--sidebar-width":"13.2rem"} as React.CSSProperties}>
    <Sidebar collapsible="offcanvas" className="rescro-sidebar">
      <SidebarHeader className="brand"><span>RESCRO</span></SidebarHeader>
      <SidebarContent><SidebarGroup><SidebarGroupContent><SidebarMenu>
        {nav.map(([Icon,label])=><SidebarMenuItem key={label}><SidebarMenuButton isActive={label==="Orders"} tooltip={label}><Icon/><span>{label}</span></SidebarMenuButton></SidebarMenuItem>)}
      </SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent>
      <SidebarFooter><button className="profile"><span><UserRound/></span><span><b>Admin</b><small>Super Admin</small></span><ChevronRight/></button></SidebarFooter>
    </Sidebar>

    <SidebarInset><main className="portal-shell">
      <header className="topbar">
        <div className="title-wrap"><SidebarTrigger className="mobile-trigger"><Menu/></SidebarTrigger><div><h1>Orders Overview</h1><p>Real-time overview of all manufacturing orders</p></div></div>
        <div className="top-actions"><Button variant="outline"><Globe2/> .nl</Button><Button variant="outline"><RefreshCw/> Sync Store</Button><Button variant="outline"><FileClock/> Audit Logs</Button><Button className="create"><Plus/> Create Order</Button><Button variant="outline" size="icon" className="round"><UserRound/></Button></div>
      </header>
      <section className="export-row">{selected.length>0&&<span className="selected-count">{selected.length} order{selected.length>1?"s":""} selected</span>}<Button variant="outline"><FileSpreadsheet/> Export Excel</Button><Button variant="outline"><Download/> Export Customs</Button><Button variant="outline"><Download/> Export PDF</Button></section>
      <section className="metrics">
        <MetricCard label="TOTAL ORDERS" value={orders.length} hint="All orders in system" percent={pct(finished)} color="#6d28d9" icon={Box}/>
        <MetricCard label="NOT STARTED ORDERS" value={notStarted} hint="Waiting for Mesh" percent={pct(notStarted)} color="#f07b12" icon={Clock3}/>
        <MetricCard label="ORDERS IN PRODUCTION" value={production} hint="Including Packed" percent={pct(production)} color="#1769e0" icon={CircleGauge}/>
        <MetricCard label="FINISHED ORDERS" value={finished} hint="Manually finished" percent={pct(finished)} color="#16a34a" icon={CheckCircle2}/>
      </section>
      <Card className="flow-card">
        <div className="section-heading"><div><h2>PRODUCTION FLOW</h2><p>Track orders as they move through the production process</p></div><Activity/></div>
        <div className="flow">{flow.map((item,index)=>{const config=stageConfig[item];const Icon=config.icon;return <button type="button" className={`flow-step${stage===item?" active":""}`} key={item} onClick={()=>{setStage(item);requestAnimationFrame(()=>document.getElementById("orders-table")?.scrollIntoView({behavior:"smooth",block:"start"}))}} aria-label={`Show ${item} orders`}>
          <div className="flow-visual"><span style={{color:config.color,background:config.soft}}><Icon/></span>{index<flow.length-1&&<i/>}</div><b>{index+1}</b><strong>{item}</strong><small>{lastLabel[item]}</small>
        </button>})}</div>
        <div className="notice"><ShieldCheck/> Packed orders are not automatically finished. An authorized admin must finish them manually.</div>
      </Card>
      <Card className="orders-card" id="orders-table">
        <div className="filters">
          <label><span>Search Order</span><div className="search"><Search/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by order or customer..."/></div></label>
          <label><span>Store</span><Select value={store} onValueChange={setStore}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All stores</SelectItem>{[".nl",".de",".fr",".dk",".uk",".es",".pl"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></label>
          <label><span>Status / Stage</span><Select value={stage} onValueChange={setStage}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All stages</SelectItem>{flow.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></label>
          <Button variant="outline" className="filter-button"><Filter/> Filters</Button>
          <Button variant="ghost" onClick={()=>{setQuery("");setStore("all");setStage("all")}}><RefreshCw/> Reset</Button>
        </div>
        <div className="table-wrap"><Table>
          <TableHeader><TableRow><TableHead><Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all visible orders"/></TableHead><TableHead>Order Number</TableHead><TableHead>Customer</TableHead><TableHead>Order Date</TableHead><TableHead>Store</TableHead><TableHead>Status / Stage</TableHead><TableHead>Last Completed Stage</TableHead><TableHead>ETA</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map(order=><TableRow key={order.id} data-state={selected.includes(order.id)?"selected":undefined}>
            <TableCell><Checkbox checked={selected.includes(order.id)} onCheckedChange={()=>setSelected(current=>current.includes(order.id)?current.filter(id=>id!==order.id):[...current,order.id])} aria-label={`Select ${order.id}`}/></TableCell>
            <TableCell className="order-id">{order.id}</TableCell><TableCell>{order.customer}</TableCell><TableCell>{order.date}</TableCell><TableCell><Badge variant="secondary">{order.store}</Badge></TableCell><TableCell><StageBadge stage={order.stage}/></TableCell>
            <TableCell><span className="last-stage" style={{"--dot":stageConfig[order.stage].color} as React.CSSProperties}>{order.last}</span></TableCell><TableCell><Badge variant="outline" className="eta">{order.eta}</Badge></TableCell>
            <TableCell><div className="row-actions"><Link className="view-order-link" href={`/orders/${encodeURIComponent(order.id)}`}><Eye/> View Order</Link><Button variant="ghost" size="icon"><MoreHorizontal/></Button></div></TableCell>
          </TableRow>)}</TableBody>
        </Table>{filtered.length===0&&<div className="empty"><Search/><b>No orders found</b><span>Try changing your search or filters.</span></div>}</div>
        <footer className="pagination"><span>Showing {filtered.length} of {orders.length} orders</span><div><Button variant="outline" size="icon"><ChevronLeft/></Button><Button className="page-active">1</Button><Button variant="outline">2</Button><Button variant="outline" size="icon"><ChevronRight/></Button></div></footer>
      </Card>
    </main></SidebarInset>

  </SidebarProvider>;
}
