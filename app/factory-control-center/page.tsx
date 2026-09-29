"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, ChevronDown, ChevronRight, Search, Send } from "lucide-react";
import { LegacyShell } from "@/components/legacy-shell";
import { poolOrders, type PoolOrder } from "@/lib/order-pool";
import { readReleasedIds, releaseOrders } from "@/lib/release";

type Sort = "order" | "date" | "item";
type Direction = "asc" | "desc";

export default function FactoryControl() {
  const [term, setTerm] = useState(""); const [sort, setSort] = useState<Sort>("date"); const [dir, setDir] = useState<Direction>("asc");
  const [expanded, setExpanded] = useState<string[]>([]); const [selected, setSelected] = useState<string[]>([]); const [released, setReleased] = useState(() => new Set<string>());
  useEffect(() => { const sync = () => setReleased(readReleasedIds()); sync(); window.addEventListener("rescro-release-updated", sync); return () => window.removeEventListener("rescro-release-updated", sync); }, []);
  const rows = useMemo(() => poolOrders.filter((order) => !order.items.some((item) => released.has(item.id))).filter((order) => `${order.id} ${order.items.map((item) => item.name).join(" ")}`.toLowerCase().includes(term.toLowerCase())).sort((a, b) => { const value = (order: typeof a) => sort === "order" ? order.id : sort === "date" ? order.date : order.items[0].name; return value(a).localeCompare(value(b)) * (dir === "asc" ? 1 : -1); }), [term, sort, dir, released]);
  const sortBy = (key: Sort) => key === sort ? setDir((value) => value === "asc" ? "desc" : "asc") : (setSort(key), setDir("asc"));
  const eligibleIds = (order: PoolOrder) => order.items.filter((item) => item.manufactured).map((item) => item.id);
  const choose = (id: string) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const chooseOrder = (order: PoolOrder) => { const ids = eligibleIds(order); const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id)); setSelected((items) => allSelected ? items.filter((id) => !ids.includes(id)) : [...new Set([...items, ...ids])]); };
  const send = () => { if (!selected.length) return; releaseOrders(selected); setReleased(readReleasedIds()); setSelected([]); };
  const rowGrid = { gridTemplateColumns: "48px 1.4fr 1fr .8fr 48px" } as React.CSSProperties;

  return <LegacyShell><div className="pool-page"><header className="pool-page-heading"><div><span>FACTORY CONTROL CENTER</span><h1>Order Pool</h1><p>Imported Orders</p><small>Select a complete order from the right column, or open it to select individual production items.</small></div><div className="pool-toolbar"><label><Search/><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search order or item…"/></label><button disabled={!selected.length} onClick={send}><Send/> Add Selected to Production</button></div></header><section className="pool-data-card"><div className="pool-data-meta"><b>ORDER POOL</b><span>{rows.length} imported orders</span></div><div className="pool-grid pool-header" style={rowGrid}><span/><button onClick={() => sortBy("order")}>Order <ArrowDownUp/></button><button onClick={() => sortBy("date")}>Order Date <ArrowDownUp/></button><button onClick={() => sortBy("item")}>Items <ArrowDownUp/></button><span>Select</span></div>{rows.map((order) => { const ids = eligibleIds(order); const wholeChecked = ids.length > 0 && ids.every((id) => selected.includes(id)); return <div className="pool-record" key={order.id}><div className="pool-grid pool-main-row" style={rowGrid}><button className="pool-expand" onClick={() => setExpanded((items) => items.includes(order.id) ? items.filter((item) => item !== order.id) : [...items, order.id])}>{expanded.includes(order.id) ? <ChevronDown/> : <ChevronRight/>}</button><b>{order.id}</b><span>{order.date}</span><span>{order.items.length} Items</span><input className="pool-order-checkbox" type="checkbox" aria-label={`Select ${order.id}`} checked={wholeChecked} onChange={() => chooseOrder(order)}/></div>{expanded.includes(order.id) ? <div className="pool-details"><div className="pool-item-grid pool-item-header"><span>Select</span><span>Item Name</span><span>Quantity</span><span>Color</span></div>{order.items.map((item) => { const external = !item.manufactured; return <div className="pool-item-grid" key={item.id}><input type="checkbox" checked={selected.includes(item.id)} disabled={external} onChange={() => choose(item.id)}/><b>{item.name}{external ? <small>Production excluded</small> : null}</b><span>{item.quantity}</span><span>{item.color}</span></div>; })}</div> : null}</div>; })}<footer className="pool-table-footer"><span>{selected.length} item selected</span><button disabled={!selected.length} onClick={send}><Send/> Add Selected to Production</button></footer></section></div></LegacyShell>;
}
