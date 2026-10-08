"use client";
import {useI18n} from "@/components/i18n-provider";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { Activity, CalendarDays, CheckCircle2, ChevronDown, RefreshCw, Target } from "lucide-react";
import { LegacyShell } from "@/components/legacy-shell";
import { config } from "@/components/factory-ui";
import { stages } from "@/lib/orders";
import { useProduction, ProductionNotice } from "@/components/production-provider";
import { aggregateOrders, completedOrderDate, dateKey } from "@/lib/production-model";
import { readReleasedProductionItems } from "@/lib/release";

const target=220;


export default function LiveProduction(){ const {t,locale} = useI18n(); 
  const {snapshot}=useProduction();
  const produced=aggregateOrders(snapshot.items).filter(order=>completedOrderDate(snapshot.items.filter(item=>item.orderId===order.id))===dateKey()).length;
  const completedToday=produced;
  const [items,setItems]=useState<ReturnType<typeof readReleasedProductionItems>>([]);
  useEffect(()=>{const sync=()=>setItems(readReleasedProductionItems());sync();window.addEventListener("rescro-release-updated",sync);return()=>window.removeEventListener("rescro-release-updated",sync)},[]);
  const inProduction=aggregateOrders(items).filter(order=>order.stage!=="Finished").length;
  const progress=Math.min(100,Math.round((produced/target)*100));
  const today=new Intl.DateTimeFormat(locale,{day:"numeric",month:"long",year:"numeric"}).format(new Date());
  const weekday=new Intl.DateTimeFormat(locale,{weekday:"long"}).format(new Date());
  const lastUpdated=new Intl.DateTimeFormat(locale,{hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(snapshot.updatedAt||Date.now()));
  const counts=Object.fromEntries(stages.map(stage=>[stage,items.filter(item=>item.stage===stage).reduce((total,item)=>total+item.quantity,0)]));

  return <LegacyShell><div className="live-reference-view">
    <header className="reference-top">
      <div className="reference-title"><span>{t("LIVE PRODUCTION")}</span><h1>{t("Factory Status")}</h1><p>{t("Real-time overview of today's production progress.")}</p></div>
      <div className="reference-meta">
        <div className="reference-date"><CalendarDays/><span><b>{today}</b><small>{weekday}</small></span></div>
        <div className="reference-updated"><RefreshCw/><span><b>{t("Last updated")}</b><small>{lastUpdated}</small></span></div>
      </div>
    </header>

    <ProductionNotice/><section className="reference-kpis">
      <article className="reference-kpi target"><i><Target/></i><div><b>{t("Daily Target")}</b><strong>{target}</strong><small>{t("orders planned for today")}</small></div><em/></article>
      <Link href="/?view=in-production#orders-table" className="reference-kpi production"><i><Activity/></i><div><b>{t("In Production")}</b><strong>{inProduction}</strong><small>{t("orders currently in progress")}</small></div><em/></Link>
      <Link href="/?stage=Finished&view=completed-today#orders-table" className="reference-kpi completed"><i><CheckCircle2/></i><div><b>{t("Completed Today")}</b><strong>{completedToday}</strong><small>{t("orders finished")}</small></div><em/></Link>
      <article className="reference-kpi daily-progress"><i><Activity/></i><div><b>{t("Daily Progress")}</b><strong>{progress}%</strong><small>{produced} {t(" of ")}{target} {t(" orders")}</small></div><div className="reference-ring" style={{"--ring":`${progress * 3.6}deg`} as CSSProperties}><b>{progress}%</b></div></article>
    </section>

    <section className="reference-flow-panel">
      <div className="reference-flow-head"><div><h2>{t("Production Flow")}</h2><p>{t("Click a station to view its orders on the Dashboard.")}</p></div><button type="button"><CalendarDays/>{t("Today")}<ChevronDown/></button></div>
      <div className="reference-flow-scroll"><div className="reference-flow-row">
        {stages.map((stage,index)=>{const station=config[stage];const Icon=station.icon;return <Link key={stage} href={`/?stage=${encodeURIComponent(stage)}#orders-table`} className="reference-stage" style={{"--station":station.color} as CSSProperties}><i><Icon/></i><strong>{counts[stage]}</strong><b>{t(station.short)}</b><small>{stage==="Finished" ? t("Completed") : t(stage)}</small>{index<stages.length-1?<em>→</em>:null}</Link>})}
      </div></div>
    </section>
  </div></LegacyShell>;
}
