const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {NextRequest,NextResponse}=require('next/server');
function load(file,imports){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>n==='next/server'?{NextRequest,NextResponse}:imports[n],Date,Math,Number,URL});return exports;}
test('registration uses verified identity and HTTP-only invite cookie for either auth provider; failures retain attribution',async()=>{
 for(const provider of ['email','google'])for(const fail of [false,true]){
 let received;const db={auth:{admin:{getUserById:async()=>({data:{user:{email:'new@test',app_metadata:{provider},user_metadata:{full_name:'New Partner'}}}})}},rpc:async(name,args)=>{received={name,args};return fail?{error:{message:'Invalid invitation'}}:{data:{id:'agent',status:'draft'}}}};
 const api=load('src/app/api/partner/onboarding/start/route.ts',{'@/lib/auth-server':{verifyRequestToken:async()=>({uid:'verified-user'})},'@/lib/supabase-server':{supabaseServer:()=>db},'@/lib/partners/service':{createAgentCode:()=> 'new-code'}});
 const req=new NextRequest('https://example.test/api/partner/onboarding/start',{method:'POST',headers:{cookie:'partner_invite='+ 'a'.repeat(64),authorization:'Bearer verified'},body:JSON.stringify({user_id:'attacker',sponsor_id:'attacker',role:'super_admin'})});const response=await api.POST(req);
 assert.equal(received.name,'register_partner');assert.equal(received.args.p_user_id,'verified-user');assert.equal(received.args.p_invite,'a'.repeat(64));assert.equal(received.args.role,undefined);
 assert.equal(response.status,fail?400:200);assert.equal(response.cookies.has('partner_invite'),!fail);
 }
});
test('invite scans preserve a valid code in secure HTTP-only cookie; invalid scans replace stale attribution',async()=>{
 const db={from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{id:'one',status:'active',invite_enabled:true,invite_expires_at:null}})})};
 const api=load('src/app/invite/[code]/route.ts',{'@/lib/supabase-server':{supabaseServer:()=>db}});
 for(const code of ['a'.repeat(64),'bad-code']){const response=await api.GET(new NextRequest('https://example.test/invite/'+code),{params:Promise.resolve({code})});const cookie=response.cookies.get('partner_invite');assert.equal(cookie.value,code==='bad-code'?'invalid':code);assert.equal(cookie.httpOnly,true);assert.equal(cookie.secure,true);assert.equal(cookie.sameSite,'lax');assert.equal(cookie.path,'/');assert.ok(response.headers.get('location').includes('account=1'));}
});
test('My Team rejects non-partners and scopes every network query to the verified partner',async()=>{
 for(const role of ['customer','partner']){const calls=[];const db={from(table){const c={table,filters:[]};calls.push(c);const q={select(){return q},eq(...v){c.filters.push(v);return q},gt(){return q},order(){return q},limit(){return q},range(){return q},single:async()=>({data:{id:'own-agent',invite_code:'a'.repeat(64),invite_enabled:true,status:'active'}}),then(resolve,reject){return Promise.resolve({data:[],count:0}).then(resolve,reject)}};return q}};
 const api=load('src/app/api/partner/team/route.ts',{'@/lib/auth-server':{verifyRequestToken:async()=>({uid:'verified-user',role})},'@/lib/supabase-server':{supabaseServer:()=>db}});const response=await api.GET(new NextRequest('https://example.test/api/partner/team?agent_id=other'));
 assert.equal(response.status,role==='partner'?200:403);if(role==='customer')assert.equal(calls.length,0);else{assert.deepEqual(calls[0].filters,[['user_id','verified-user']]);for(const c of calls.slice(1))assert.ok(c.filters.some(([key,value])=>['ancestor_id','descendant_id'].includes(key)&&value==='own-agent'));}
 }
});
