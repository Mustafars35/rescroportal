"use client";

import { useMemo, useState } from "react";
import { BarChart3, Boxes, CalendarDays, CheckCircle2 } from "lucide-react";
import { LegacyShell } from "@/components/legacy-shell";
import { config } from "@/components/factory-ui";
import { stages } from "@/lib/orders";

export default function ProductionOverview(){
  const [date,setDate]=useState("2026-09-14");
  const seed=useMemo(()=>Number(date.slice(-2))||14,[date]);
  const values=stages.map((stage,index)=>({stage,value:Math.max(86,164-index*9+(seed+index*3)%12)}));
  const finished=values.find(item=>item.stage==="Finished")?.value??0;
  const entering=values[0]?.value??0;
  const average=Math.round(values.reduce((sum,item)=>sum+item.value,0)/values.length);
  const formattedDate=date.split("-").reverse().join("/");
  const maximum=Math.max(...values.map(item=>item.value));

  return <LegacyShell><div className="overview-reference-view">
    <header className="overview-reference-top">
      <div><span>PRODUCTION OVERVIEW</span><h1>Production Overview</h1><p>Summary of today&apos;s production output and station activity.</p></div>
      <label className="overview-date-picker"><CalendarDays/><input type="date" value={date} onChange={event=>setDate(event.target.value)}/></label>
    </header>

    <section className="overview-reference-kpis">
      <article className="overview-kpi date"><i><CalendarDays/></i><div><b>Selected date</b><strong>{formattedDate}</strong><small>Daily report</small></div></article>
      <article className="overview-kpi total"><i><BarChart3/></i><div><b>Daily total production</b><strong>{finished}</strong><small>Finished items</small></div><em/></article>
      <article className="overview-kpi entering"><i><Boxes/></i><div><b>Items entering production</b><strong>{entering}</strong><small>Started at Mesh</small></div><em/></article>
      <article className="overview-kpi average"><i><CheckCircle2/></i><div><b>Average station output</b><strong>{average}</strong><small>Completed items</small></div><em/></article>
    </section>

    <section className="overview-station-panel">
      <header><span>STATION ACTIVITY</span><h2>Completed production stages</h2><p>Total completed items per station for the selected date.</p></header>
      <div className="overview-stations">
        {values.map(item=>{const station=config[item.stage];const Icon=station.icon;const label=item.stage==="Waiting for Packing"?"Waiting for Packing":station.short;return <div className="overview-station-row" key={item.stage}><i style={{"--station":station.color} as React.CSSProperties}><Icon/></i><b>{label}</b><strong>{item.value}</strong><span><em style={{width:`${Math.round(item.value/maximum*100)}%`}}/></span><small>Completed</small></div>})}
      </div>
    </section>
  </div></LegacyShell>;
}
