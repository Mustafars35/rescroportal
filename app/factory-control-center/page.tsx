"use client";
import {useI18n} from "@/components/i18n-provider";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, ChevronDown, ChevronRight, Search, Send } from "lucide-react";
import { LegacyShell } from "@/components/legacy-shell";
import { poolOrders, type PoolOrder } from "@/lib/order-pool";
import { useProduction, ProductionNotice } from "@/components/production-provider";
import { useAuth } from "@/components/auth-provider";
import { readReleasedIds, releaseOrders } from "@/lib/release";

type Sort = "order" | "date" | "item";
type Direction = "asc" | "desc";

export default function FactoryControl() { const {t,locale,formatDate} = useI18n(); 
  const {snapshot,loading,refresh}=useProduction(); const {user}=useAuth(); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const [term, setTerm] = useState(""); const [sort, setSort] = useState<Sort>("date"); const [dir, setDir] = useState<Direction>("asc");
  const [expanded, setExpanded] = useState<string[]>([]); const [selected, setSelected] = useState<string[]>([]); const [released, setReleased] = useState(() => new Set<string>());
  useEffect(() => { const sync = () => setReleased(readReleasedIds()); sync(); window.addEventListener("rescro-release-updated", sync); return () => window.removeEventListener("rescro-release-updated", sync); }, []);
  useEffect(()=>{setSelected(current=>current.filter(id=>!released.has(id)&&snapshot.orders.some(order=>order.items.some(item=>item.id===id)&&!order.items.some(item=>released.has(item.id)))));},[released,snapshot]);
  const rows = useMemo(() => snapshot.orders.filter((order) => !order.items.some((item) => released.has(item.id))).filter((order) => `${order.id} ${order.items.map((item) => item.name).join(" ")}`.toLowerCase().includes(term.toLowerCase())).sort((a, b) => { const value = (order: typeof a) => sort === "order" ? order.id : sort === "date" ? order.date.split("/").reverse().join("-") : String(order.items.length).padStart(4,"0"); return value(a).localeCompare(value(b)) * (dir === "asc" ? 1 : -1); }), [term, sort, dir, released, snapshot]);
  const sortBy = (key: Sort) => key === sort ? setDir((value) => value === "asc" ? "desc" : "asc") : (setSort(key), setDir("asc"));
  const eligibleIds = (order: PoolOrder) => order.items.filter((item) => item.manufactured).map((item) => item.id);
  const choose = (id: string) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const chooseOrder = (order: PoolOrder) => { const ids = eligibleIds(order); const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id)); setSelected((items) => allSelected ? items.filter((id) => !ids.includes(id)) : [...new Set([...items, ...ids])]); };
  const send = async () => { if (!selected.length || busy) return; setBusy(true); setError(""); try { await releaseOrders(selected); await refresh(true); setReleased(readReleasedIds()); setSelected([]); } catch(error) { setError(error instanceof Error?error.message:"Release failed."); await refresh(true); } finally { setBusy(false); } };
  const rowGrid = { gridTemplateColumns: "48px 1.4fr 1fr .8fr 48px" } as React.CSSProperties;

  if (user && user.role!=="Admin") return <LegacyShell><p>{t("Only Admin can manage the Order Pool.")}</p></LegacyShell>;
  return <LegacyShell><div className="pool-page"><header className="pool-page-heading"><div><span>{t("FACTORY CONTROL CENTER")}</span><h1>{t("Order Pool")}</h1><p>{t("Imported Orders")}</p><small>{t("Select a complete order from the right column, or open it to select individual production items.")}</small></div><div className="pool-toolbar"><label><Search/><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder={t("Search order or item…")}/></label><button disabled={!selected.length||busy||loading} onClick={()=>void send()}><Send/> {t(" Add Selected to Production")}</button></div></header><ProductionNotice/>{error&&<p className="auth-error" role="alert">{t(error)}</p>}<section className="pool-data-card"><div className="pool-data-meta"><b>{t("ORDER POOL")}</b><span>{rows.length} {t(" imported orders")}</span></div><div className="pool-grid pool-header" style={rowGrid}><span/><button onClick={() => sortBy("order")}>{t("Order ")}<ArrowDownUp/></button><button onClick={() => sortBy("date")}>{t("Order Date ")}<ArrowDownUp/></button><button onClick={() => sortBy("item")}>{t("Items ")}<ArrowDownUp/></button><span>{t("Select")}</span></div>{rows.map((order) => { const ids = eligibleIds(order); const wholeChecked = ids.length > 0 && ids.every((id) => selected.includes(id)); return <div className="pool-record" key={order.id}><div className="pool-grid pool-main-row" style={rowGrid}><button className="pool-expand" onClick={() => setExpanded((items) => items.includes(order.id) ? items.filter((item) => item !== order.id) : [...items, order.id])}>{expanded.includes(order.id) ? <ChevronDown/> : <ChevronRight/>}</button><b>{order.id}</b><span>{formatDate(order.date)}</span><span>{order.items.length} {t(" Items")}</span><input disabled={busy||!ids.length} className="pool-order-checkbox" type="checkbox" aria-label={t("Select {0}", {0: order.id})} checked={wholeChecked} onChange={() => chooseOrder(order)}/></div>{expanded.includes(order.id) ? <div className="pool-details"><div className="pool-item-grid pool-item-header"><span>{t("Select")}</span><span>{t("Item Name")}</span><span>{t("Quantity")}</span><span>{t("Color")}</span></div>{order.items.map((item) => { const external = !item.manufactured; return <div className="pool-item-grid" key={item.id}><input type="checkbox" checked={selected.includes(item.id)} disabled={external||busy} onChange={() => choose(item.id)}/><b>{item.name}{external ? <small>{t("Production excluded")}</small> : null}</b><span>{item.quantity}</span><span>{item.color}</span></div>; })}</div> : null}</div>; })}<footer className="pool-table-footer"><span>{selected.length} {t(" item selected")}</span><button disabled={!selected.length||busy||loading} onClick={()=>void send()}><Send/> {t(" Add Selected to Production")}</button></footer></section></div></LegacyShell>;
}
