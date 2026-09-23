import Link from "next/link";
import type { CSSProperties } from "react";
import { Activity, CalendarDays, CheckCircle2, ChevronDown, RefreshCw, Target } from "lucide-react";
import { LegacyShell } from "@/components/legacy-shell";
import { config } from "@/components/factory-ui";
import { orders, stages } from "@/lib/orders";

const target=220;
const produced=164;
const completedToday=9;

export default function LiveProduction(){
  const inProduction=orders.filter(order=>!["Finished","Waiting for Mesh"].includes(order.stage)).length;
  const progress=Math.round((produced/target)*100);
  const today=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"long",year:"numeric"}).format(new Date());
  const weekday=new Intl.DateTimeFormat("en-GB",{weekday:"long"}).format(new Date());
  const lastUpdated=new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date());
  const counts=Object.fromEntries(stages.map(stage=>[stage,orders.filter(order=>order.stage===stage).reduce((total,order)=>total+order.quantity,0)]));

  return <LegacyShell><div className="live-reference-view">
    <header className="reference-top">
      <div className="reference-title"><span>LIVE PRODUCTION</span><h1>Factory Status</h1><p>Real-time overview of today&apos;s production progress.</p></div>
      <div className="reference-meta">
        <div className="reference-date"><CalendarDays/><span><b>{today}</b><small>{weekday}</small></span></div>
        <div className="reference-updated"><RefreshCw/><span><b>Last updated</b><small>{lastUpdated}</small></span></div>
      </div>
    </header>

    <section className="reference-kpis">
      <article className="reference-kpi target"><i><Target/></i><div><b>Daily Target</b><strong>{target}</strong><small>orders planned for today</small></div><em/></article>
      <Link href="/?view=in-production#orders-table" className="reference-kpi production"><i><Activity/></i><div><b>In Production</b><strong>{inProduction}</strong><small>orders currently in progress</small></div><em/></Link>
      <Link href="/?stage=Finished&view=completed-today#orders-table" className="reference-kpi completed"><i><CheckCircle2/></i><div><b>Completed Today</b><strong>{completedToday}</strong><small>orders finished</small></div><em/></Link>
      <article className="reference-kpi daily-progress"><i><Activity/></i><div><b>Daily Progress</b><strong>{progress}%</strong><small>{produced} of {target} orders</small></div><div className="reference-ring" style={{"--ring":`${progress * 3.6}deg`} as CSSProperties}><b>{progress}%</b></div></article>
    </section>

    <section className="reference-flow-panel">
      <div className="reference-flow-head"><div><h2>Production Flow</h2><p>Click a station to view its orders. The list below will show the orders in the selected stage.</p></div><button type="button"><CalendarDays/>Today<ChevronDown/></button></div>
      <div className="reference-flow-scroll"><div className="reference-flow-row">
        {stages.map((stage,index)=>{const station=config[stage];const Icon=station.icon;return <Link key={stage} href={`/?stage=${encodeURIComponent(stage)}#orders-table`} className="reference-stage" style={{"--station":station.color} as CSSProperties}><i><Icon/></i><strong>{counts[stage]}</strong><b>{station.short}</b><small>{stage==="Finished"?"Completed":stage}</small>{index<stages.length-1?<em>→</em>:null}</Link>})}
      </div></div>
    </section>
  </div></LegacyShell>;
}
