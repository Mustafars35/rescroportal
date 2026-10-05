"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp, UsersRound } from "lucide-react";
import { LegacyShell } from "@/components/legacy-shell";
import { config } from "@/components/factory-ui";
import { useProduction, ProductionNotice } from "@/components/production-provider";
import { dateKey, stationTotals } from "@/lib/production-model";
import { stages, type Stage } from "@/lib/orders";

type Period="day"|"month"|"custom";

function periodLabel(period:Period,date:string,month:string,start:string,end:string){
  if(period==="day")return date.split("-").reverse().join("/");
  if(period==="month")return new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(new Date(`${month}-01T12:00:00`));
  return `${start.split("-").reverse().join("/")} – ${end.split("-").reverse().join("/")}`;
}

export default function StationPerformance(){
  const {snapshot}=useProduction();
  const today=dateKey();
  const [period,setPeriod]=useState<Period>("day");
  const [date,setDate]=useState(today);
  const [month,setMonth]=useState(today.slice(0,7));
  const [start,setStart]=useState(today.slice(0,7)+"-01");
  const [end,setEnd]=useState(today);
  const [expanded,setExpanded]=useState<Stage|null>(null);
  const from=period==="day"?date:period==="month"?`${month}-01`:start;
  const until=period==="day"?date:period==="month"?`${month}-31`:end;
  const data=stationTotals(snapshot.events,from,until).map(({stage,value})=>({stage,completed:value,queue:snapshot.items.filter(item=>item.stage===stage).reduce((sum,item)=>sum+item.quantity,0),status:"On track"}));
  function employees(stage:Stage){const grouped=new Map<string,{name:string;count:number}>();for(const event of snapshot.events){if(event.action!=="completed"||event.station!==stage||dateKey(event.at)<from||dateKey(event.at)>until)continue;const key=event.userId??event.userName;const current=grouped.get(key)??{name:event.userName,count:0};current.count+=event.quantity;grouped.set(key,current);}return [...grouped.values()].sort((a,b)=>b.count-a.count);}

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

    <ProductionNotice/>{from>until&&<p className="auth-error" role="alert">Start date must not be after end date.</p>}<section className="performance-kpis">
      <article><i><CalendarDays/></i><div><b>Selected period</b><strong>{label}</strong><small>Performance report</small></div></article>
    </section>

    <section className="performance-panel">
      <header><span>STATION PERFORMANCE</span><h2>Completed items by station</h2><p>Click a station to view employee completion records for the selected period.</p></header>
      <div className="performance-rows">
        {data.map(item=>{const station=config[item.stage];const Icon=station.icon;const label=item.stage==="Waiting for Packing"?"Waiting for Packing":station.short;const isOpen=expanded===item.stage;return <div className={`performance-station${isOpen?" open":""}`} key={item.stage} style={{"--station":station.color} as React.CSSProperties}>
          <button className="performance-station-trigger" onClick={()=>setExpanded(isOpen?null:item.stage)} aria-expanded={isOpen}><i><Icon/></i><b>{label}</b><strong>{item.completed.toLocaleString("en-GB")}</strong><span>Completed</span><em><small style={{width:`${Math.min(100,Math.round(item.completed/(data[0].completed||1)*100))}%`}}/></em><span className="station-queue">{item.queue} in queue</span><span className={item.status==="On track"?"station-status":"station-status building"}>{item.status}</span>{isOpen?<ChevronUp/>:<ChevronDown/>}</button>
          {isOpen?<div className="employee-breakdown"><div className="employee-breakdown-title"><UsersRound/><div><b>Employee performance</b><small>Completion records for {label}</small></div></div>{employees(item.stage).length?employees(item.stage).map(employee=><div className="employee-production-row" key={employee.name}><b>{employee.name}</b><span>{employee.count} completed</span><span><em style={{width:`${item.completed?employee.count/item.completed*100:0}%`}}/></span></div>):<div className="employee-empty"><b>No completions in this period</b><span>Employee totals are recorded automatically when a signed-in user completes an item.</span></div>}<div className="employee-total"><span>Total completed</span><strong>{item.completed.toLocaleString("en-GB")}</strong></div></div>:null}
        </div>})}
      </div>
    </section>
  </div></LegacyShell>;
}
