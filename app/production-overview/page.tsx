"use client";
import {useI18n} from "@/components/i18n-provider";

import { useMemo, useState } from "react";
import { BarChart3, Boxes, CalendarDays, CheckCircle2 } from "lucide-react";
import { LegacyShell } from "@/components/legacy-shell";
import { config } from "@/components/factory-ui";
import { useProduction, ProductionNotice } from "@/components/production-provider";
import { dateKey, stationTotals } from "@/lib/production-model";
import { stages } from "@/lib/orders";

export default function ProductionOverview(){ const {t,locale,formatDate} = useI18n(); 
  const {snapshot}=useProduction();
  const [date,setDate]=useState(()=>dateKey());
  const values=stationTotals(snapshot.events,date,date);
  const finished=values.find(item=>item.stage==="Finished")?.value??0;
  const entering=snapshot.events.filter(event=>event.action==="released"&&dateKey(event.at)===date).reduce((sum,event)=>sum+event.quantity,0);
  const average=Math.round(values.reduce((sum,item)=>sum+item.value,0)/values.length);
  const formattedDate=formatDate(date);
  const maximum=Math.max(1,...values.map(item=>item.value));

  return <LegacyShell><div className="overview-reference-view">
    <header className="overview-reference-top">
      <div><span>{t("PRODUCTION OVERVIEW")}</span><h1>{t("Production Overview")}</h1><p>{t("Summary of today's production output and station activity.")}</p></div>
      <label className="overview-date-picker"><CalendarDays/><input type="date" value={date} onChange={event=>setDate(event.target.value)}/></label>
    </header>

    <ProductionNotice/><section className="overview-reference-kpis">
      <article className="overview-kpi date"><i><CalendarDays/></i><div><b>{t("Selected date")}</b><strong>{formattedDate}</strong><small>{t("Daily report")}</small></div></article>
      <article className="overview-kpi total"><i><BarChart3/></i><div><b>{t("Daily total production")}</b><strong>{finished}</strong><small>{t("Finished items")}</small></div><em/></article>
      <article className="overview-kpi entering"><i><Boxes/></i><div><b>{t("Items entering production")}</b><strong>{entering}</strong><small>{t("Started at Mesh")}</small></div><em/></article>
      <article className="overview-kpi average"><i><CheckCircle2/></i><div><b>{t("Average station output")}</b><strong>{average}</strong><small>{t("Completed items")}</small></div><em/></article>
    </section>

    <section className="overview-station-panel">
      <header><span>{t("STATION ACTIVITY")}</span><h2>{t("Completed production stages")}</h2><p>{t("Total completed items per station for the selected date.")}</p></header>
      <div className="overview-stations">
        {values.map(item=>{const station=config[item.stage];const Icon=station.icon;const label=item.stage==="Waiting for Packing"?"Waiting for Packing":station.short;return <div className="overview-station-row" key={item.stage}><i style={{"--station":station.color} as React.CSSProperties}><Icon/></i><b>{t(label)}</b><strong>{item.value}</strong><span><em style={{width:`${Math.round(item.value/maximum*100)}%`}}/></span><small>{t("Completed")}</small></div>})}
      </div>
    </section>
  </div></LegacyShell>;
}
