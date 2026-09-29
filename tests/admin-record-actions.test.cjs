const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>imports[n]});return exports;}
const config=load('src/lib/admin-records.ts'),{NextRequest,NextResponse}=require('next/server');const id='11111111-1111-4111-8111-111111111111';
function fixture(allowed=true,result={data:{id},error:null}){let calls=[];const route=load('src/app/api/admin/records/[module]/[id]/route.ts',{'next/server':{NextRequest,NextResponse},zod:require('zod'),'@/lib/admin-records':config,'@/lib/auth-server':{verifyRequestToken:async()=>({uid:'admin'})},'@/lib/rbac':{ensureAdminPermission:async(u,e,m,a)=>{calls.push([m,a]);return allowed}},'@/lib/supabase-server':{supabaseServer:()=>({from:table=>{const chain={delete:()=>{calls.push(['delete',table]);return chain},update:body=>{calls.push(['update',table,body]);return chain},eq:(key,value)=>{calls.push(['eq',key,value]);return chain},select:()=>chain,maybeSingle:async()=>result};return chain}})}});return {route,calls};}
function req(method,body){return new NextRequest('https://site.test/api/admin/records/customers/'+id,{method,...(body?{body:JSON.stringify(body),headers:{'content-type':'application/json'}}:{})})}const ctx=module=>({params:Promise.resolve({module,id})});
test('edit and delete actions enforce separate module permissions',async()=>{for(const module of Object.keys(config.recordModules)){const f=fixture(false);assert.equal((await f.route.DELETE(req('DELETE'),ctx(module))).status,403);assert.equal(f.calls.length,1);assert.equal(f.calls[0][1],'delete');}const f=fixture();assert.equal((await f.route.DELETE(req('DELETE'),ctx('policies'))).status,200);assert.deepEqual(f.calls[0],['quotes_policies','delete']);});
test('validation rejects malformed data and arbitrary columns without updating',async()=>{for(const body of [{name:'A',contact:'123',email:'bad'}, {name:'Person',contact:'9876543210',email:'',user_id:id}]){const f=fixture();assert.equal((await f.route.PATCH(req('PATCH',body),ctx('customers'))).status,400);assert.equal(f.calls.length,1)}const f=fixture();assert.equal((await f.route.PATCH(req('PATCH',{name:'Person',contact:'9876543210',email:''}),ctx('customers'))).status,200);assert.equal(f.calls[1][0],'update')});
test('missing rows and foreign key dependencies are reported',async()=>{let f=fixture(true,{data:null,error:null});assert.equal((await f.route.DELETE(req('DELETE'),ctx('leads'))).status,404);f=fixture(true,{data:null,error:{code:'23503'}});const r=await f.route.DELETE(req('DELETE'),ctx('partners'));assert.equal(r.status,409);assert.match((await r.json()).error,/linked/);});

test('policy deletion is atomically restricted to cancelled status',async()=>{
 const f=fixture();assert.equal((await f.route.DELETE(req('DELETE'),ctx('policies'))).status,200);
 assert.ok(f.calls.some(c=>c[0]==='eq'&&c[1]==='status'&&c[2]==='cancelled'));
 const blocked=fixture(true,{data:null,error:null});const response=await blocked.route.DELETE(req('DELETE'),ctx('policies'));
 assert.equal(response.status,409);assert.match((await response.json()).error,/Only cancelled policies/);
 const other=fixture();await other.route.DELETE(req('DELETE'),ctx('customers'));
 assert.ok(!other.calls.some(c=>c[0]==='eq'&&c[1]==='status'));
});

test('policy dependency errors explain review migration and protected financial history',async()=>{
 for(const [table,message] of [['policy_review_history',/Apply database migration/],['earning_ledger',/financial history/],['clawbacks',/financial history/]]){
  const f=fixture(true,{data:null,error:{code:'23503',message:`foreign key constraint on ${table}`}});
  const response=await f.route.DELETE(req('DELETE'),ctx('policies'));
  assert.equal(response.status,409);assert.match((await response.json()).error,message);
 }
});
