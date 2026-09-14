import { Card } from "@/components/ui/card"; import { LegacyShell } from "@/components/legacy-shell";
const data=[["Today’s Production","164","units produced"],["Yesterday","211","units produced"],["7-Day Average","216","units / day"],["30-Day Average","208","units / day"]];
export default function ProductionOverview(){return <LegacyShell><section className="control-grid production-overview">{data.map(([label,value,hint])=><Card className="control-metric" key={label}><div><span>{label}</span><strong>{value}</strong><small>{hint}</small></div></Card>)}</section></LegacyShell>}
