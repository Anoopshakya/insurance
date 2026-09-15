const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {NextRequest,NextResponse}=require('next/server');
function setup(path,allowed=true,role='admin'){
 const calls=[],exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,File:require("node:buffer").File,require:n=>({'next/server':{NextRequest,NextResponse},zod:require('zod'),'@/lib/auth-server':{verifyRequestToken:async()=>({uid:'signed-in-user',role})},'@/lib/rbac':{ensureAdminPermission:async()=>allowed},'@/lib/supabase-server':{supabaseServer:()=>({rpc:async(name,args)=>{calls.push({name,args});return {data:{id:'created'}}}})}})[n]});
 return {calls,post:body=>exports.POST(new NextRequest('https://site.test/api/policy',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}))};
}
const id='11111111-1111-4111-8111-111111111111';
test('review requires admin edit permission and records the authenticated reviewer',async()=>{
 const path='src/app/api/admin/policies/review/route.ts';const denied=setup(path,false);assert.equal((await denied.post({id,decision:'approved',expectedStatus:'pending'})).status,403);assert.equal(denied.calls.length,0);
 const s=setup(path);assert.equal((await s.post({id,decision:'hold',note:'',expectedStatus:'pending'})).status,400);
 assert.equal((await s.post({id,decision:'approved',expectedStatus:'pending',userId:'attacker'})).status,200);assert.equal(s.calls[0].args.p_user_id,'signed-in-user');assert.equal(s.calls[0].args.p_expected_status,'pending');
});
test('partner submission cannot supply approval, owner or policy status',async()=>{
 const path='src/app/api/partner/lead-policy/route.ts';const s=setup(path,true,'partner');
 const body={leadId:id,policyNumber:'TEST-001',sectorId:id,productTypeId:id,insurerId:id,premium:100,startDate:'2026-09-14',tenureMonths:12,businessType:'fresh',status:'issued',review_status:'approved',agentId:id};
 assert.equal((await s.post(body)).status,201);assert.equal(s.calls[0].args.p_user_id,'signed-in-user');for(const key of ['status','review_status','agentId'])assert.equal(s.calls[0].args.p_details[key],undefined);
 assert.equal((await setup(path,true,'customer').post(body)).status,403);
});
