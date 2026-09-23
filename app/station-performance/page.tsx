"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp, PackageCheck, UsersRound } from "lucide-react";
import { LegacyShell } from "@/components/legacy-shell";
import { config } from "@/components/factory-ui";
import { stages, type Stage } from "@/lib/orders";

type Period="day"|"month"|"custom";

function periodLabel(period:Period,date:string,month:string,start:string,end:string){
  if(period==="day")return date.split("-").reverse().join("/");
  if(period==="month")return new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(new Date(`${month}-01T12:00:00`));
  return `${start.split("-").reverse().join("/")} – ${end.split("-").reverse().join("/")}`;
}

export default function StationPerformance(){
  const [period,setPeriod]=useState<Period>("day");
  const [date,setDate]=useState("2026-09-14");
  const [month,setMonth]=useState("2026-09");
  const [start,setStart]=useState("2026-09-01");
  const [end,setEnd]=useState("2026-09-23");
  const [expanded,setExpanded]=useState<Stage|null>(null);
  const periodSeed=period==="day"?Number(date.slice(-2)):period==="month"?Number(month.slice(-2))+17:Number(start.slice(-2))+Number(end.slice(-2));
  const multiplier=period==="day"?1:period==="month"?22:12;
  const data=useMemo(()=>stages.map((stage,index)=>{const base=245-index*9+(periodSeed+index)%9;const completed=base*multiplier;const queue=[18,24,16,31,14,37,11,4][index];return {stage,completed,queue,processing:`${17+index*3} min`,status:queue>30?"Queue building":"On track"};}),[periodSeed,multiplier]);
  const packed=data.find(item=>item.stage==="Packed")?.completed??0;
  const label=periodLabel(period,date,month,start,end);

  return <LegacyShell><div className="performance-reference-view">
    <header className="performance-reference-top">
      <div><span>STATION PERFORMANCE</span><h1>Station Performance</h1><p>Review station and employee production performance for the selected period.</p></div>
      <div className="performance-period-picker">
        <div className="period-tabs"><button className={period==="day"?"active":""} onClick={()=>setPeriod("day")}>Day</button><button className={period==="month"?"active":""} onClick={()=>setPeriod("month")}>Month</button><button className={period==="custom"?"active":""} onClick={()=>setPeriod("custom")}>Custom Range</button></div>
        {period==="day"?<label><CalendarDays/><input aria-label="Selected day" type="date" value={date} onChange={event=>setDate(event.target.value)}/></label>:null}
        {period==="month"?<label><CalendarDays/><input aria-label="Selected month" type="month" value={month} onChange={event=>setMonth(event.target.value)}/></label>:null}
        {period==="custom"?<div className="range-inputs"><label><input aria-label="Start date" type="date" value={start} onChange={event=>setStart(event.target.value)}/></label><span>–</span><label><input aria-label="End date" type="date" value={end} onChange={event=>setEnd(event.target.value)}/></label></div>:null}
      </div>
    </header>

    <section className="performance-kpis">
      <article><i><CalendarDays/></i><div><b>Selected period</b><strong>{label}</strong><small>Performance report</small></div></article>
      <article><i><PackageCheck/></i><div><b>Packed output</b><strong>{packed.toLocaleString("en-GB")}</strong><small>Packed items</small></div><em/></article>
    </section>

    <section className="performance-panel">
      <header><span>STATION PERFORMANCE</span><h2>Completed items by station</h2><p>Click a station to view employee completion records for the selected period.</p></header>
      <div className="performance-rows">
        {data.map(item=>{const station=config[item.stage];const Icon=station.icon;const label=item.stage==="Waiting for Packing"?"Waiting for Packing":station.short;const isOpen=expanded===item.stage;return <div className={`performance-station${isOpen?" open":""}`} key={item.stage} style={{"--station":station.color} as React.CSSProperties}>
          <button className="performance-station-trigger" onClick={()=>setExpanded(isOpen?null:item.stage)} aria-expanded={isOpen}><i><Icon/></i><b>{label}</b><strong>{item.completed.toLocaleString("en-GB")}</strong><span>Completed</span><em><small style={{width:`${Math.min(100,Math.round(item.completed/(data[0].completed||1)*100))}%`}}/></em><span className="station-queue">{item.queue} in queue</span><span className={item.status==="On track"?"station-status":"station-status building"}>{item.status}</span>{isOpen?<ChevronUp/>:<ChevronDown/>}</button>
          {isOpen?<div className="employee-breakdown"><div className="employee-breakdown-title"><UsersRound/><div><b>Employee performance</b><small>Completion records for {label}</small></div></div><div className="employee-empty"><b>No employee completion records available</b><span>The current demo data does not contain a reliable completed-by user value. This breakdown will populate from production logs when that field is available.</span></div><div className="employee-total"><span>Total completed</span><strong>{item.completed.toLocaleString("en-GB")}</strong></div></div>:null}
        </div>})}
      </div>
    </section>
  </div></LegacyShell>;
}
