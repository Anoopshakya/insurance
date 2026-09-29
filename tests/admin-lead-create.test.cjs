const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {NextRequest,NextResponse}=require('next/server');
const id='11111111-1111-4111-8111-111111111111';
function setup(valid=true){const inserts=[],filters=[],updates=[];const db={from:table=>{const q={select:()=>q,eq:(k,v)=>{filters.push([k,v]);return q},maybeSingle:async()=>({data:valid?{id}:null}),update:row=>{updates.push(row);return q},insert:row=>{inserts.push(row);return q},single:async()=>({data:{id}})};return q}};const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/admin/leads/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>({'next/server':{NextRequest,NextResponse},zod:require('zod'),'@/lib/auth-server':{verifyRequestToken:async()=>({uid:'admin'})},'@/lib/rbac':{ensureAdminPermission:async()=>true},'@/lib/supabase-server':{supabaseServer:()=>db}})[n]});return {inserts,filters,updates,put:body=>exports.PUT(new NextRequest("https://site.test/api/admin/leads",{method:"PUT",body:JSON.stringify(body)})),post:body=>exports.POST(new NextRequest('https://site.test/api/admin/leads',{method:'POST',body:JSON.stringify(body)}))}}
const body={name:'Test Customer',contact:'9876543210',agentId:id,productSectorId:id,productTypeId:id,purchaseTimeline:'within_7_days'};
test('admin saves product selections and timeline with lead',async()=>{const s=setup();assert.equal((await s.post(body)).status,201);assert.equal(s.inserts[0].product_sector_id,id);assert.equal(s.inserts[0].product_type_id,id);assert.equal(s.inserts[0].purchase_timeline,'within_7_days');assert.ok(s.filters.some(([k,v])=>k==='categories.active'&&v===true));assert.ok(s.filters.some(([k,v])=>k==='category_id'&&v===id))});
test('missing fields, invalid timeline and unavailable product types prevent saving',async()=>{for(const patch of [{productSectorId:''},{productTypeId:''},{purchaseTimeline:'invalid'}]){const s=setup();assert.equal((await s.post({...body,...patch})).status,400);assert.equal(s.inserts.length,0)}const s=setup(false);assert.equal((await s.post(body)).status,400);assert.equal(s.inserts.length,0)});

test('editing saves all create fields and targets only the requested lead',async()=>{
 const s=setup();assert.equal((await s.put({...body,id,priority:'high'})).status,200);
 assert.equal(s.inserts.length,0);assert.equal(s.updates[0].agent_id,id);
 assert.equal(s.updates[0].name,body.name);assert.equal(s.updates[0].contact,body.contact);
 assert.equal(s.updates[0].product_sector_id,id);assert.equal(s.updates[0].product_type_id,id);
 assert.equal(s.updates[0].purchase_timeline,body.purchaseTimeline);assert.equal(s.updates[0].priority,'high');
 assert.equal(s.updates[0].source,undefined);assert.ok(s.filters.some(([k,v])=>k==='id'&&v===id));
 const invalid=setup();assert.equal((await invalid.put(body)).status,400);assert.equal(invalid.updates.length,0);
});
