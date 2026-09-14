import { Card } from "@/components/ui/card";
import { LegacyShell } from "@/components/legacy-shell";
const data=[["Mesh",245],["Cord & Eyelet",218],["Frame",224],["Assembly",205],["Quality Control",198],["Packing",176]];
export default function StationPerformance(){return <LegacyShell><section className="page-heading"><span>STATION PERFORMANCE</span><h1>Today’s station output</h1><p>Demo production figures ready to be connected to completed production logs.</p></section><Card className="management-card performance-list">{data.map(([name,value])=><div key={String(name)}><b>{name}</b><strong>{value}</strong><i style={{width:`${Number(value)/245*100}%`}}/></div>)}</Card></LegacyShell>}
