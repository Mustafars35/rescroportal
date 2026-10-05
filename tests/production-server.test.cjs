const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
const {PGlite}=require('@electric-sql/pglite');
test('shared database: partial release, all stations, reports, logs, whole-order return, duplicate protection and authorization',async(t)=>{
 const database=new PGlite();const loaded=new Map();let currentUser=null;
 const tagged=(strings,...values)=>{let query=strings[0];values.forEach((value,index)=>{query+=`$${index+1}`+strings[index+1];});return {then:(resolve,reject)=>database.query(query,values).then(result=>result.rows).then(resolve,reject)};};
 tagged.transaction=async queries=>{await database.query('BEGIN');try{const results=[];for(const query of queries)results.push(await query);await database.query('COMMIT');return results;}catch(error){await database.query('ROLLBACK');throw error;}};

 const mocks={'@neondatabase/serverless':{neon:()=>tagged},'next/headers':{cookies:async()=>({get:()=>({value:'test-session'})})},'next/server':{NextResponse:{json:(value,init={})=>new Response(JSON.stringify(value),{...init,headers:{'Content-Type':'application/json',...init.headers}})}}};
 function load(file){if(loaded.has(file))return loaded.get(file);const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,require:name=>name==='@/lib/auth'&&loaded.has('lib/auth.ts')?{...loaded.get('lib/auth.ts'),getSessionUser:async()=>currentUser}:mocks[name]??(name.startsWith('@/')?load(name.slice(2)+'.ts'):require(name)),console,process:{env:{DATABASE_URL:'postgres://test'}},Buffer,Request,Response,URL,Date,Set,Map});loaded.set(file,module.exports);return module.exports;}
 const auth=load('lib/auth.ts');const server=load('lib/production-server.ts');const model=load('lib/production-model.ts');const route=load('app/api/production/route.ts');
 await auth.ensureAuthSchema();await database.query("INSERT INTO portal_users(id,name,username,password_hash,role) VALUES ('admin','Admin','admin','test','Admin'),('mesh','Furkan','mesh','test','Mesh')");
 const admin={id:'admin',name:'Admin',role:'Admin',permissions:[],active:true};const mesh={id:'mesh',name:'Furkan',role:'Mesh',permissions:['View Daily Production','Complete Mesh'],active:true};
 await server.ensureProductionSchema();let state=await server.productionSnapshot();assert.equal(state.orders.length,500);assert.equal(state.items.length,0);
 const parent=state.orders.find(order=>order.items.length>=3&&order.items.filter(item=>item.manufactured).length>=2);const chosen=parent.items.filter(item=>item.manufactured).slice(0,2);const selected=chosen.map(item=>item.id);const quantity=chosen.reduce((sum,item)=>sum+item.quantity,0);
 await t.test('partial release retains full original order, excludes unselected items and creates one parent',async()=>{
  await server.releaseProduction(selected,admin);state=await server.productionSnapshot();assert.equal(state.items.length,2);assert.equal(model.aggregateOrders(state.items).length,1);assert.equal(model.aggregateOrders(state.items)[0].id,parent.id);assert.equal(state.orders.find(order=>order.id===parent.id).items.length,parent.items.length);
  await assert.rejects(server.releaseProduction(selected,admin),/CONFLICT/);assert.equal((await server.productionSnapshot()).items.length,2);
  const other=state.orders.find(order=>order.id!==parent.id&&order.items.some(item=>item.manufactured));const otherId=other.items.find(item=>item.manufactured).id;await assert.rejects(server.releaseProduction([selected[0],otherId],admin),/CONFLICT/);assert.equal((await server.productionSnapshot()).items.length,2);
  const excluded=state.orders.flatMap(order=>order.items).find(item=>!item.manufactured);await assert.rejects(server.releaseProduction([excluded.id],admin),/CONFLICT/);
 });
 await t.test('no unauthorized release, return or cross-station completion; no writes without JSON or from foreign origin',async()=>{
  currentUser=mesh;const post=body=>route.POST(new Request('https://rescro.test/api/production',{method:'POST',headers:{'content-type':'application/json',origin:'https://rescro.test'},body:JSON.stringify(body)}));
  assert.equal((await post({action:'release',itemIds:selected})).status,403);assert.equal((await post({action:'return',orderId:parent.id})).status,403);assert.equal((await post({action:'complete',itemId:selected[0],station:'Assembly',run:1})).status,403);
  currentUser=admin;assert.equal((await route.POST(new Request('https://rescro.test/api/production',{method:'POST',headers:{'content-type':'application/json',origin:'https://foreign.test'},body:JSON.stringify({action:'release',itemIds:selected})}))).status,403);
  currentUser={...mesh,permissions:["View Dashboard"]};const visible=await (await route.GET()).json();assert.equal(visible.orders.length,1);assert.equal(visible.orders[0].id,parent.id);
  currentUser=null;assert.equal((await route.GET()).status,401);
 });
 await t.test('order waits for every selected item at every station; no item can skip ahead or complete twice',async()=>{
  for(const station of model.workStations){
    const actor=station==='Mesh'?mesh:admin;
    await server.completeProduction(selected[0],station,actor,1);
    state=await server.productionSnapshot();
    assert.ok(state.items.every(item=>item.stage===model.workStage[station]));
    assert.equal(state.items.find(item=>item.id===selected[0]).stationCompleted,true);
    assert.equal(state.items.find(item=>item.id===selected[1]).stationCompleted,false);
    await assert.rejects(server.completeProduction(selected[0],station,actor,1),/CONFLICT/);
    if(station!=='Packaging')await assert.rejects(server.completeProduction(selected[0],model.workStations[model.workStations.indexOf(station)+1],admin,1),/CONFLICT/);
    await server.completeProduction(selected[1],station,admin,1);
    state=await server.productionSnapshot();
    assert.ok(state.items.every(item=>item.stage===model.nextWorkStage(model.workStage[station])));
    assert.ok(state.items.every(item=>!item.stationCompleted));
  }
  assert.equal(model.aggregateOrders(state.items)[0].stage,'Finished');
 });
 await t.test('reports count real quantities, completion actor and timestamps; employee totals match station total',async()=>{
  const today=model.dateKey();const totals=model.stationTotals(state.events,today,today);for(const row of totals)assert.equal(row.value,quantity);
  const meshEvents=state.events.filter(event=>event.station==='Waiting for Mesh'&&event.action==='completed');assert.equal(meshEvents.reduce((sum,event)=>sum+event.quantity,0),quantity);assert.equal(meshEvents.find(event=>event.itemId===selected[0]).userName,'Furkan');assert.equal(meshEvents.length,2);
  const {rows}=await database.query("SELECT * FROM portal_audit_logs WHERE action='production_stage_completed'");assert.equal(rows.length,12);assert.equal(rows.filter(row=>row.actor_user_id==='mesh').length,1);
 });
 await t.test('whole-order return removes all production children, preserves history and allows a new run',async()=>{
  await server.returnProduction(parent.id,admin);state=await server.productionSnapshot();assert.equal(state.items.length,0);assert.equal(state.orders.find(order=>order.id===parent.id).items.length,parent.items.length);assert.ok(state.events.some(event=>event.action==='returned'));
  await assert.rejects(server.returnProduction(parent.id,admin),/CONFLICT/);await assert.rejects(server.completeProduction(selected[0],'Mesh',mesh,1),/CONFLICT/);
  await server.releaseProduction([selected[0]],admin);state=await server.productionSnapshot();assert.equal(state.items.length,1);assert.equal(state.items[0].run,2);assert.equal(state.items[0].stage,'Waiting for Mesh');assert.equal(model.aggregateOrders(state.items).length,1);await assert.rejects(server.completeProduction(selected[0],'Mesh',mesh,1),/CONFLICT/);await server.completeProduction(selected[0],'Mesh',mesh,2);
 });
 await database.close();
});
