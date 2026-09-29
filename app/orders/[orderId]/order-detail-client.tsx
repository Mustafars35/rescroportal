"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, PackageOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PoolOrder } from "@/lib/order-pool";
import { readReleasedIds } from "@/lib/release";

export default function OrderDetailClient({ order }: { order: PoolOrder }) {
  const [released, setReleased] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    const sync = () => setReleased(readReleasedIds());
    sync(); window.addEventListener("rescro-release-updated", sync);
    return () => window.removeEventListener("rescro-release-updated", sync);
  }, []);
  const productionItems = order.items.filter((item) => released.has(item.id));

  return <main className="order-detail-page">
    <header className="detail-topbar"><Link href="/" className="detail-logo">RESCRO</Link><div className="detail-actions"><Link href="/" className="back-link"><ArrowLeft/> Orders</Link></div></header>
    <div className="detail-container">
      <Link href="/" className="return-link"><ArrowLeft/> Back to Orders</Link>
      <section className="order-summary">
        <div><span>Order Number</span><strong>{order.id}</strong></div><div><span>Customer</span><strong>{order.customer}</strong></div><div><span>Order Date</span><strong>{order.date}</strong></div>
        <div><span>Original Shopify Items</span><strong>{order.items.length} items</strong></div><div><span>Items in Production</span><strong>{productionItems.length}</strong></div>
        <div><span>Order Status</span><Badge className="summary-stage">{productionItems.length ? "In Production" : "Not Sent to Production"}</Badge></div>
      </section>
      <div className="items-heading"><div><h1>Order Items</h1><p>Original Shopify order and the production state of each item.</p></div><Badge>{order.items.length} ITEMS</Badge></div>
      {order.items.map((item, index) => {
        const inProduction = released.has(item.id);
        return <article className="order-item-card" key={item.id}>
          <header className="item-card-header"><div><span className="item-number">{index + 1}</span><div><h2>{item.name}</h2><p>{item.quantity} × {item.color}</p></div></div><Badge className={inProduction ? "current-stage" : ""}>{inProduction ? "Waiting for Mesh" : item.manufactured ? "Not Sent to Production" : "Production excluded"}</Badge></header>
          <div className="production-section compact-section"><header><h3>Production Status</h3>{inProduction ? <CheckCircle2/> : <Clock3/>}</header><dl className="detail-grid three"><div className="detail-field"><dt>Item status</dt><dd>{inProduction ? "In Production" : "Not Sent to Production"}</dd></div><div className="detail-field"><dt>Current stage</dt><dd>{inProduction ? "Waiting for Mesh" : "—"}</dd></div><div className="detail-field"><dt>Production eligibility</dt><dd>{item.manufactured ? "Factory-made item" : "External / excluded item"}</dd></div></dl></div>
        </article>;
      })}
      <section className="package-section"><header><div><h2>Production summary</h2><p>The Shopify order remains one parent order. Only selected child items enter production.</p></div><PackageOpen/></header><strong>{productionItems.length} of {order.items.length} items released to production</strong></section>
    </div>
  </main>;
}
