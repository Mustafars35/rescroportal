// Explicit fixture import for isolated PGlite tests; never loaded by application code.
exports.seedProductionFixtures=async(database,orders)=>{
 await database.query(`WITH source AS (SELECT value AS data FROM jsonb_array_elements($1::jsonb)), inserted AS (
 INSERT INTO portal_production_orders(id,data) SELECT data->>'id',data FROM source RETURNING id
 ) INSERT INTO portal_production_items(id,order_id,data,excluded)
 SELECT item->>'id',source.data->>'id',item,COALESCE(item->>'manufactured'='false',false) OR lower(item->>'name') LIKE '%easyclick%'
 FROM source CROSS JOIN LATERAL jsonb_array_elements(source.data->'items') item WHERE (SELECT COUNT(*) FROM inserted)>=0`,[JSON.stringify(orders)]);
};
