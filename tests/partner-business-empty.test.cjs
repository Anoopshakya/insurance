const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function endpoint(name,{count=0,fail=false,role='partner'}={}){
 const calls=[];
 const db={from(table){const call={table,filters:[]};calls.push(call);const q={select(value,options){call.options=options;return q},eq(...args){call.filters.push(['eq',...args]);return q},in(...args){call.filters.push(['in',...args]);return q},gte(...args){call.filters.push(['gte',...args]);return q},lte(...args){call.filters.push(['lte',...args]);return q},order(){return q},limit(){return q},single:async()=>({data:{id:'partner-one'}}),maybeSingle:async()=>({data:{id:'partner-one'}}),then(resolve,reject){return Promise.resolve({data:[],count,error:fail?{message:'unavailable'}:null}).then(resolve,reject)}};return q}};
 const imports={'next/server':{NextResponse:{json:(body,options)=>({body,...options})}},'@/lib/auth-server':{verifyRequestToken:async()=>({uid:'user-one',role})},'@/lib/supabase-server':{supabaseServer:()=>db}};
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(`src/app/api/partner/${name}/route.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>imports[n],Date,Intl,Map,Set,Number});return {api:exports,calls};
}
const request={headers:{get:()=> 'Bearer token'},nextUrl:new URL('https://example.test/api/partner/policies?renewals=1&agent_id=other')};
test('renewals query is partner scoped and limits active/issued policies to 30 days',async()=>{
 const {api,calls}=endpoint('policies');const r=await api.GET(request);assert.equal(r.body.data.length,0);const filters=calls.find(c=>c.table==='policies').filters;
 assert.ok(filters.some(f=>f[0]==='eq'&&f[1]==='agent_id'&&f[2]==='partner-one'));
 assert.deepEqual(Array.from(filters.find(f=>f[0]==='in')[2]),['active','issued']);
 const start=filters.find(f=>f[0]==='gte'),end=filters.find(f=>f[0]==='lte');assert.equal(start[1],'expiry_date');assert.equal(end[1],'expiry_date');assert.equal((new Date(end[2])-new Date(start[2]))/86400000,30);
});
test('earnings empty state uses all-time record count even when period totals are zero',async()=>{
 for(const count of [0,1]){const {api,calls}=endpoint('earnings',{count});const r=await api.GET(request);assert.equal(r.body.hasActivity,count>0);assert.equal(r.body.summary.totalEarnings,0);const activity=calls.find(c=>c.options?.head);assert.equal(activity.options.count,'exact');assert.equal(activity.filters.length,1);assert.equal(activity.filters[0][2],'partner-one');}
});
test('failed activity checks return errors, not empty states',async()=>{for(const name of ['policies','earnings']){const {api}=endpoint(name,{fail:true});assert.equal((await api.GET(request)).status,500)}});
test('customers cannot access partner policies or earnings',async()=>{for(const name of ['policies','earnings']){const {api,calls}=endpoint(name,{role:'customer'});assert.equal((await api.GET(request)).status,403);assert.equal(calls.length,0)}});
