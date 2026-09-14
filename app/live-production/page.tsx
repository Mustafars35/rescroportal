import { Card } from "@/components/ui/card";
import { LegacyShell } from "@/components/legacy-shell";
import { Flow } from "@/components/factory-ui";
export default function LiveProduction(){return <LegacyShell><section className="page-heading"><span>LIVE PRODUCTION / FACTORY STATUS</span><h1>Current station load</h1><p>Live count of products at each manufacturing station. A bottleneck is highlighted where work is accumulating.</p></section><Card className="flow-card live-production-card"><Flow/></Card></LegacyShell>}
