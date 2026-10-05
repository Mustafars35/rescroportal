import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { ensureAuthSchema, type SessionUser } from "@/lib/auth";
import { poolOrders, type PoolOrder } from "@/lib/order-pool";
import { nextWorkStage, workStage, type WorkStation, type ProductionSnapshot, type ProductionItem, type ProductionEvent } from "@/lib/production-model";
import type { Stage } from "@/lib/orders";

const database=()=>{const url=process.env.DATABASE_URL??process.env.POSTGRES_URL;if(!url)throw new Error("Database unavailable");return neon(url);};
let schema:Promise<void>|undefined;
export function ensureProductionSchema() {
  if (!schema) schema=initialize().catch(error=>{schema=undefined;throw error;});
  return schema;
}
async function initialize() {
  await ensureAuthSchema();const db=database();
  await db`CREATE TABLE IF NOT EXISTS portal_production_orders (id TEXT PRIMARY KEY, data JSONB NOT NULL, location TEXT NOT NULL DEFAULT 'pool' CHECK(location IN ('pool','production')), run INTEGER NOT NULL DEFAULT 0, released_at TIMESTAMPTZ, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await db`CREATE TABLE IF NOT EXISTS portal_production_items (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES portal_production_orders(id), data JSONB NOT NULL, selected BOOLEAN NOT NULL DEFAULT FALSE, stage TEXT NOT NULL DEFAULT 'Waiting for Mesh', stage_entered_at TIMESTAMPTZ, completed_at TIMESTAMPTZ)`;
  await db`CREATE INDEX IF NOT EXISTS portal_production_items_queue_idx ON portal_production_items(stage,selected,order_id)`;
  await db`CREATE TABLE IF NOT EXISTS portal_production_events (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES portal_production_orders(id), item_id TEXT REFERENCES portal_production_items(id), station TEXT NOT NULL, action TEXT NOT NULL, quantity INTEGER NOT NULL, actor_user_id TEXT REFERENCES portal_users(id) ON DELETE SET NULL, actor_name TEXT NOT NULL, run INTEGER NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await db`CREATE INDEX IF NOT EXISTS portal_production_events_date_idx ON portal_production_events(created_at,station)`;
  // Idempotent demo import: never overwrites an existing order or its production state.
  await db`WITH source AS (SELECT value AS data FROM jsonb_array_elements(${JSON.stringify(poolOrders)}::jsonb)), inserted AS (
    INSERT INTO portal_production_orders(id,data) SELECT data->>'id',data FROM source ON CONFLICT(id) DO NOTHING RETURNING id
  ) INSERT INTO portal_production_items(id,order_id,data)
    SELECT item->>'id',source.data->>'id',item FROM source CROSS JOIN LATERAL jsonb_array_elements(source.data->'items') item
    WHERE (SELECT COUNT(*) FROM inserted)>=0 ON CONFLICT(id) DO NOTHING`;
}
export async function productionSnapshot():Promise<ProductionSnapshot> {
  await ensureProductionSchema();const db=database();
  // One SQL statement gives all three lists the same database snapshot.
  const [row]=await db`SELECT
    (SELECT COALESCE(jsonb_agg(data ORDER BY id),'[]'::jsonb) FROM portal_production_orders) AS orders,
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('data',i.data,'order_id',i.order_id,'order_data',o.data,'stage',i.stage,'released_at',o.released_at,'stage_entered_at',i.stage_entered_at,'completed_at',i.completed_at,'run',o.run) ORDER BY o.released_at,i.id),'[]'::jsonb) FROM portal_production_items i JOIN portal_production_orders o ON o.id=i.order_id WHERE i.selected AND o.location='production') AS items,
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'order_id',order_id,'item_id',item_id,'station',station,'action',action,'quantity',quantity,'actor_user_id',actor_user_id,'actor_name',actor_name,'created_at',created_at,'run',run) ORDER BY created_at),'[]'::jsonb) FROM portal_production_events) AS events, NOW() AS updated_at`;
  const items=(row.items as Record<string,unknown>[]).map(value=>{const parent=value.order_data as PoolOrder;return {...value.data as ProductionItem,orderId:String(value.order_id),orderDate:parent.date,customer:parent.customer,stage:value.stage as Stage,releasedAt:String(value.released_at),stageEnteredAt:String(value.stage_entered_at),completedAt:value.completed_at?String(value.completed_at):null,run:Number(value.run)};});
  const events=(row.events as Record<string,unknown>[]).map(value=>({id:String(value.id),orderId:String(value.order_id),itemId:value.item_id?String(value.item_id):null,station:value.station as Stage,action:value.action as ProductionEvent['action'],quantity:Number(value.quantity),userId:value.actor_user_id?String(value.actor_user_id):null,userName:String(value.actor_name),at:String(value.created_at),run:Number(value.run)}));
  return {orders:row.orders as PoolOrder[],items,events,updatedAt:String(row.updated_at)};
}
export async function releaseProduction(itemIds:string[],actor:SessionUser) {
  await ensureProductionSchema();const db=database();const operation=randomUUID();
  const result=await db`WITH requested AS (SELECT DISTINCT value AS id FROM jsonb_array_elements_text(${JSON.stringify(itemIds)}::jsonb)), locked AS MATERIALIZED (
    SELECT o.id,o.location FROM portal_production_orders o WHERE o.id IN(SELECT i.order_id FROM portal_production_items i JOIN requested r ON r.id=i.id) ORDER BY o.id FOR UPDATE
  ), valid AS (
    SELECT i.id,i.order_id FROM portal_production_items i JOIN requested r ON r.id=i.id JOIN locked o ON o.id=i.order_id WHERE o.location='pool' AND (i.data->>'manufactured')::boolean
  ), moved AS (
    UPDATE portal_production_orders o SET location='production',run=run+1,released_at=NOW(),updated_at=NOW()
    WHERE o.id IN(SELECT order_id FROM valid) AND o.location='pool' AND (SELECT COUNT(*) FROM valid)=(SELECT COUNT(*) FROM requested) RETURNING o.id,o.run
  ), selected AS (
    UPDATE portal_production_items i SET selected=TRUE,stage='Waiting for Mesh',stage_entered_at=NOW(),completed_at=NULL FROM moved o
    WHERE i.order_id=o.id AND i.id IN(SELECT id FROM requested) RETURNING i.id,i.order_id,i.data,o.run
  ), events AS (
    INSERT INTO portal_production_events(id,order_id,item_id,station,action,quantity,actor_user_id,actor_name,run)
    SELECT ${operation}||':'||id,order_id,id,'Waiting for Mesh','released',(data->>'quantity')::int,${actor.id},${actor.name},run FROM selected RETURNING id
  ), audit AS (
    INSERT INTO portal_audit_logs(id,actor_user_id,actor_name,action,entity_type,entity_id,details)
    SELECT ${operation}||':release:'||id,${actor.id},${actor.name},'order_sent_to_production','order',id,jsonb_build_object('itemIds',(SELECT jsonb_agg(s.id) FROM selected s WHERE s.order_id=m.id),'run',run) FROM moved m RETURNING id
  ) SELECT (SELECT COUNT(*) FROM selected)::int AS count,(SELECT COUNT(*) FROM audit)::int AS orders`;
  if(Number(result[0].count)!==itemIds.length)throw new Error("CONFLICT: Items are already released, excluded or unavailable. Refresh the Order Pool.");
  return result[0];
}
export async function completeProduction(itemId:string,station:WorkStation,actor:SessionUser,run:number) {
  await ensureProductionSchema();const db=database();const expected=workStage[station];const next=nextWorkStage(expected);const operation=randomUUID();
  const result=await db`WITH locked AS MATERIALIZED (
    SELECT o.id,o.run FROM portal_production_orders o JOIN portal_production_items i ON i.order_id=o.id WHERE i.id=${itemId} AND o.location='production' AND o.run=${run} FOR UPDATE OF o
  ), changed AS (
    UPDATE portal_production_items i SET stage=${next},stage_entered_at=NOW(),completed_at=CASE WHEN ${next}='Finished' THEN NOW() ELSE NULL END
    FROM locked o WHERE i.id=${itemId} AND i.order_id=o.id AND i.selected AND i.stage=${expected} RETURNING i.id,i.order_id,i.data,o.run
  ), events AS (
    INSERT INTO portal_production_events(id,order_id,item_id,station,action,quantity,actor_user_id,actor_name,run)
    SELECT ${operation}||':'||c.id||':'||s.station,c.order_id,c.id,s.station,'completed',(c.data->>'quantity')::int,${actor.id},${actor.name},c.run FROM changed c
    CROSS JOIN LATERAL (SELECT ${expected}::text AS station UNION ALL SELECT 'Packed' WHERE ${next}='Finished' UNION ALL SELECT 'Finished' WHERE ${next}='Finished') s RETURNING id
  ), audit AS (
    INSERT INTO portal_audit_logs(id,actor_user_id,actor_name,action,entity_type,entity_id,details)
    SELECT ${operation},${actor.id},${actor.name},'production_stage_completed','production_item',id,jsonb_build_object('orderNumber',order_id,'itemId',id,'station',${station}::text,'nextStage',${next}::text,'quantity',(data->>'quantity')::int,'run',run) FROM changed RETURNING id
  ) SELECT (SELECT COUNT(*) FROM changed)::int AS count,(SELECT COUNT(*) FROM audit)::int AS logged`;
  if(Number(result[0].count)!==1)throw new Error("CONFLICT: This item has already moved, or was returned to the Order Pool. Refresh your queue.");
}
export async function returnProduction(orderId:string,actor:SessionUser) {
  await ensureProductionSchema();const db=database();const operation=randomUUID();
  const result=await db`WITH locked AS MATERIALIZED (SELECT id FROM portal_production_orders WHERE id=${orderId} FOR UPDATE), moved AS (
    UPDATE portal_production_orders SET location='pool',released_at=NULL,updated_at=NOW() WHERE id IN(SELECT id FROM locked) AND location='production' RETURNING id,run
  ), cleared AS (
    UPDATE portal_production_items i SET selected=FALSE,stage='Waiting for Mesh',stage_entered_at=NULL,completed_at=NULL FROM moved o WHERE i.order_id=o.id RETURNING i.id
  ), events AS (
    INSERT INTO portal_production_events(id,order_id,station,action,quantity,actor_user_id,actor_name,run) SELECT ${operation},id,'Waiting for Mesh','returned',0,${actor.id},${actor.name},run FROM moved RETURNING id
  ), audit AS (
    INSERT INTO portal_audit_logs(id,actor_user_id,actor_name,action,entity_type,entity_id,details) SELECT ${operation},${actor.id},${actor.name},'order_returned_to_pool','order',id,jsonb_build_object('run',run) FROM moved RETURNING id
  ) SELECT (SELECT COUNT(*) FROM moved)::int AS count,(SELECT COUNT(*) FROM cleared)::int AS items`;
  if(Number(result[0].count)!==1)throw new Error("CONFLICT: This order is already in the Order Pool.");
}
