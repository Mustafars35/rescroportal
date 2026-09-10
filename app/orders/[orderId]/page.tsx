import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Box, Check, CheckCircle2, Clock3, Frame, Hammer,
  PackageCheck, Pencil, ShieldCheck, Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getOrder, stages, type Stage } from "@/lib/orders";

const stageMeta: Record<Stage, { color: string; soft: string; icon: typeof Clock3 }> = {
  "Waiting for Mesh": { color: "#f07b12", soft: "#fff4e8", icon: Clock3 },
  "Waiting for Frame": { color: "#7338e6", soft: "#f3edff", icon: Frame },
  "Waiting for Assembly": { color: "#1769e0", soft: "#edf5ff", icon: Hammer },
  "Quality Control": { color: "#0a958f", soft: "#e9fbf8", icon: ShieldCheck },
  "Waiting for Packing": { color: "#e87512", soft: "#fff3e8", icon: Box },
  "Packed": { color: "#16a34a", soft: "#eaf9ef", icon: PackageCheck },
  "Finished": { color: "#6d28d9", soft: "#f3edff", icon: CheckCircle2 },
};

function DataField({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return <div className="detail-field"><dt>{label}</dt><dd>{value}</dd>{note ? <small>{note}</small> : null}</div>;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = getOrder(orderId);
  if (!order) notFound();

  const activeIndex = stages.indexOf(order.stage);
  const isDouble = order.product.includes("Double");
  const meshType = order.product.includes("Pollen") ? "Pollen" : "Standard";
  const pileCount = Math.round((order.direction === "Vertical" ? order.height : order.width) / (isDouble ? 4 : 2) + (isDouble ? 0 : 5));
  const meshLength = order.direction === "Vertical" ? order.width - 4.2 : order.height - 4.2;
  const channelFrame = (order.direction === "Vertical" ? order.width : order.height) - 7;
  const channellessFrame = (order.direction === "Vertical" ? order.height : order.width) - 7;
  const wingFrame = (order.direction === "Vertical" ? order.width : order.height) - 7.6;
  const thresholdless = (order.direction === "Vertical" ? order.width : order.height) - 3.4;
  const cordLength = order.width + order.height + 20;

  return <main className="order-detail-page">
    <header className="detail-topbar">
      <Link href="/" className="detail-logo">RESCRO</Link>
      <div className="detail-actions">
        <span className="role-pill">Super Admin</span>
        <span className="language-pill">English</span>
        <Link href="/" className="back-link"><ArrowLeft/> Orders</Link>
        <button type="button" className="edit-order"><Pencil/> Edit Order</button>
        <button type="button" className="delete-order"><Trash2/> Delete</button>
      </div>
    </header>

    <div className="detail-container">
      <Link href="/" className="return-link"><ArrowLeft/> Back to Orders</Link>

      <section className="order-summary">
        <div><span>Order Number</span><strong>{order.id}</strong></div>
        <div><span>Customer</span><strong>{order.customer}</strong></div>
        <div><span>Order Date</span><strong>{order.date}</strong></div>
        <div><span>Store</span><strong>{order.store}</strong></div>
        <div><span>Items</span><strong>{order.quantity} item{order.quantity > 1 ? "s" : ""}</strong></div>
        <div><span>Order Status</span><Badge className="summary-stage" style={{color:stageMeta[order.stage].color,background:stageMeta[order.stage].soft}}>{order.stage}</Badge></div>
      </section>

      <div className="items-heading"><div><h1>Order Items</h1><p>Production measurements and stage progress</p></div><Badge>{order.quantity} ITEM{order.quantity > 1 ? "S" : ""}</Badge></div>

      <article className="order-item-card">
        <header className="item-card-header">
          <div><span className="item-number">1</span><div><h2>Item 1</h2><p>{order.product}</p></div></div>
          <div className="item-progress-copy"><strong>{Math.max(activeIndex, 0)}/7 stages completed</strong><span><i style={{width:`${Math.max(activeIndex,0)/7*100}%`}}/></span></div>
        </header>

        <div className="item-flow">
          {stages.map((stageName,index)=>{const meta=stageMeta[stageName];const Icon=meta.icon;const completed=index<activeIndex;const active=index===activeIndex;return <div className={`item-flow-step${completed?" completed":""}${active?" active":""}`} key={stageName}>
            <div className="item-flow-line"><span style={{color:meta.color,background:meta.soft}}>{completed?<Check/>:<Icon/>}</span>{index<stages.length-1?<i/>:null}</div>
            <strong>{stageName.replace("Waiting for ","")}</strong>
            <Badge variant="secondary">{completed?"Completed":active?"In progress":"Pending"}</Badge>
          </div>})}
        </div>

        <div className="item-card-toolbar"><Badge className="current-stage" style={{color:stageMeta[order.stage].color,background:stageMeta[order.stage].soft}}>{order.stage}</Badge><button type="button"><Pencil/> Edit Properties</button></div>

        <section className="production-section">
          <header><h3>Item 1 · Mesh Cutting</h3><Badge variant="secondary">Pending</Badge></header>
          <dl className="detail-grid three">
            <DataField label="Mesh" value={meshType}/><DataField label="Curtain type" value={order.product.includes("Curtain")?"Blackout":"None"}/><DataField label="Fabric color" value={order.color}/>
            <DataField label="Pile count" value={pileCount} note={isDouble?"Width ÷ 4":"(Length ÷ 2) + 5"}/><DataField label="Mesh length" value={`${meshLength.toFixed(1)} cm`} note="Wing + allowance"/><DataField label="Cord length" value={`${cordLength.toFixed(0)} cm`} note="Width + Length + 20"/>
          </dl>
        </section>

        <section className="production-section">
          <header><h3>Item 1 · Frame Cutting</h3><Badge variant="secondary">Pending</Badge></header>
          <dl className="detail-grid three">
            <DataField label="Direction" value={order.direction}/><DataField label="Threshold" value={order.threshold}/><DataField label="Channel frame" value={`${channelFrame.toFixed(1)} cm`} note="Measurement - 7"/>
            <DataField label="Channelless frame" value={`${channellessFrame.toFixed(1)} cm`} note="Measurement - 7"/><DataField label="Wing frame" value={`${wingFrame.toFixed(1)} cm`} note="Measurement - 7.6"/><DataField label="Wing count" value={isDouble?2:1}/>
            <DataField label="Thresholdless profile" value={`${thresholdless.toFixed(1)} cm`} note="Measurement - 3.4"/><DataField label="Frame color" value={order.color}/>
          </dl>
        </section>

        <section className="production-section">
          <header><h3>Item 1 · Quality Control</h3><div className="quality-tags"><Badge>Mesh Pending</Badge><Badge>Frame Pending</Badge><Badge>Assembly Pending</Badge></div></header>
          <dl className="detail-grid three">
            <DataField label="Width" value={`${order.width} cm`} note="Original size"/><DataField label="Height" value={`${order.height} cm`} note="Original size"/><DataField label="Profile color" value={order.color}/>
            <DataField label="Direction" value={order.direction}/><DataField label="Curtain type" value="None"/><DataField label="Threshold" value={order.threshold}/>
          </dl>
        </section>

        <section className="production-section compact-section">
          <header><h3>Item 1 · Assembly</h3><Badge variant="secondary">Pending</Badge></header>
          <dl className="detail-grid three"><DataField label="Profile color" value={order.color}/><DataField label="Threshold" value={order.threshold}/><DataField label="Closing" value="Magnetic"/></dl>
        </section>

        <section className="production-section compact-section">
          <header><h3>Item 1 · Packing</h3><Badge variant="secondary">Pending</Badge></header>
          <dl className="detail-grid three"><DataField label="Width" value={`${order.width} cm`}/><DataField label="Height" value={`${order.height} cm`}/><DataField label="Assembly" value="Screws and accessories"/></dl>
        </section>
      </article>

      <section className="package-section">
        <header><div><h2>Package Information</h2><p>Packages created for this order</p></div><button type="button"><Box/> Add Package</button></header>
        <div className="package-empty"><PackageCheck/><strong>No packages created yet</strong><span>Click “Add Package” to create the first package.</span></div>
      </section>
    </div>
  </main>;
}
