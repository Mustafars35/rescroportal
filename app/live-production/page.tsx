import Link from "next/link";
import type { CSSProperties } from "react";
import { Activity, CalendarDays, CheckCircle2, RefreshCw, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LegacyShell } from "@/components/legacy-shell";
import { Flow } from "@/components/factory-ui";
import { orders } from "@/lib/orders";
const target=220;
const produced=164;
const completedToday=9;

export default function LiveProduction(){
  const inProduction=orders.filter(order=>!['Finished','Waiting for Mesh'].includes(order.stage)).length;
  const progress=Math.round((produced/target)*100);
  const today=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"long",year:"numeric"}).format(new Date());
  const lastUpdated=new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date());

  return <LegacyShell>
    <section className="live-heading">
      <div className="page-heading"><span>LIVE PRODUCTION</span><h1>Factory Status</h1><p>Real-time overview of today&apos;s production progress.</p></div>
      <div className="live-meta"><div><CalendarDays/><span><b>{today}</b><small>Today</small></span></div><div><RefreshCw/><span><b>Last updated</b><small>{lastUpdated}</small></span></div></div>
    </section>
    <section className="live-summary">
      <Card className="live-kpi"><Target/><div><span>Daily Target</span><strong>{target}</strong><small>orders planned for today</small></div></Card>
      <Link className="live-kpi live-kpi-link" href="/?view=in-production#orders-table"><Card><Activity/><div><span>In Production</span><strong>{inProduction}</strong><small>orders currently in progress</small></div></Card></Link>
      <Link className="live-kpi live-kpi-link" href="/?stage=Finished&view=completed-today#orders-table"><Card><CheckCircle2/><div><span>Completed Today</span><strong>{completedToday}</strong><small>orders finished today</small></div></Card></Link>
      <Card className="live-kpi progress-kpi"><div className="progress-copy"><span>Daily Progress</span><strong>{progress}%</strong><small>{produced} of {target} orders</small></div><div className="circular-progress" style={{"--progress":`${progress * 3.6}deg`} as CSSProperties}><b>{progress}%</b></div></Card>
    </section>
    <Card className="flow-card live-production-card"><div className="section-heading"><div><h2>PRODUCTION FLOW</h2><p>Click a station to view its orders on the Dashboard.</p></div></div><Flow/></Card>
  </LegacyShell>
}
