const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {NextRequest,NextResponse}=require('next/server');
function load(file,imports){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>n==='next/server'?{NextRequest,NextResponse}:imports[n],Date,Math,Number,URL});return exports;}
test('registration uses verified identity and HTTP-only invite cookie for either auth provider; failures retain attribution',async()=>{
 for(const provider of ['email','google'])for(const fail of [false,true]){
 let received;const db={auth:{admin:{getUserById:async()=>({data:{user:{email:'new@test',app_metadata:{provider},user_metadata:{full_name:'New Partner'}}}})}},rpc:async(name,args)=>{received={name,args};return fail?{error:{message:'Invalid invitation'}}:{data:{id:'agent',status:'draft'}}}};
 const api=load('src/app/api/partner/onboarding/start/route.ts',{'@/lib/auth-server':{verifyRequestToken:async()=>({uid:'verified-user'})},'@/lib/supabase-server':{supabaseServer:()=>db},'@/lib/partners/service':{createAgentCode:()=> 'new-code'}});
 const req=new NextRequest('https://example.test/api/partner/onboarding/start',{method:'POST',headers:{cookie:'partner_invite='+ 'ABCD2345',authorization:'Bearer verified'},body:JSON.stringify({user_id:'attacker',sponsor_id:'attacker',role:'super_admin'})});const response=await api.POST(req);
 assert.equal(received.name,'register_partner');assert.equal(received.args.p_user_id,'verified-user');assert.equal(received.args.p_invite,'ABCD2345');assert.equal(received.args.role,undefined);
 assert.equal(response.status,fail?400:200);assert.equal(response.cookies.has('partner_invite'),!fail);
 }
});
test('invite scans preserve a valid code in secure HTTP-only cookie; invalid scans replace stale attribution',async()=>{
 const db={from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{id:'one',status:'active',invite_enabled:true,invite_expires_at:null}})})};
 const api=load('src/app/invite/[code]/route.ts',{'@/lib/supabase-server':{supabaseServer:()=>db}});
 for(const code of ['ABCD2345','abcd2345','bad-code','a'.repeat(64),'ABC123456','ABC_1234']){const response=await api.GET(new NextRequest('https://example.test/invite/'+code),{params:Promise.resolve({code})});const cookie=response.cookies.get('partner_invite');assert.equal(cookie.value,/^[a-z0-9]{8}$/i.test(code)?code.toUpperCase():'invalid');assert.equal(cookie.httpOnly,true);assert.equal(cookie.secure,true);assert.equal(cookie.sameSite,'lax');assert.equal(cookie.path,'/');assert.ok(response.headers.get('location').includes('account=1'));}
});
test('My Team rejects non-partners and scopes every network query to the verified partner',async()=>{
 for(const role of ['customer','partner']){const calls=[];const db={from(table){const c={table,filters:[]};calls.push(c);const q={select(){return q},eq(...v){c.filters.push(v);return q},gt(){return q},order(){return q},limit(){return q},range(){return q},single:async()=>({data:{id:'own-agent',invite_code:'ABCD2345',invite_enabled:true,status:'active'}}),then(resolve,reject){return Promise.resolve({data:[],count:0}).then(resolve,reject)}};return q}};
 const api=load('src/app/api/partner/team/route.ts',{'@/lib/auth-server':{verifyRequestToken:async()=>({uid:'verified-user',role})},'@/lib/supabase-server':{supabaseServer:()=>db}});const response=await api.GET(new NextRequest('https://example.test/api/partner/team?agent_id=other'));
 assert.equal(response.status,role==='partner'?200:403);if(role==='customer')assert.equal(calls.length,0);else{assert.deepEqual(calls[0].filters,[['user_id','verified-user']]);for(const c of calls.slice(1))assert.ok(c.filters.some(([key,value])=>['ancestor_id','descendant_id'].includes(key)&&value==='own-agent'));}
 }
});
function populatedTeam({fail=false}={}) {
 const calls=[];
 const members=Array.from({length:12},(_,i)=>({depth:i===11?2:1,member:{id:'member-'+i,agent_code:'MP'+i,status:i===1?'draft':'active',region:null,created_at:'2026-09-'+String(i+1).padStart(2,'0'),users:{full_name:i===0?'=Formula':'Partner '+i,phone:'98765432'+String(i).padStart(2,'0')}}}));
 const db={from(table){const filters=[];let bounds=[0,499];const q={select(){return q},eq(k,v){filters.push([k,v]);return q},gt(){return q},in(k,v){filters.push([k,v]);return q},order(){return q},limit(){return q},range(a,b){bounds=[a,b];return q},single:async()=>({data:{id:'own-agent',invite_code:'ABCD2345',invite_enabled:true,status:'active'}}),then(resolve,reject){calls.push({table,filters});let data=[];
 if(table==='network_closure')data=filters.some(([k])=>k==='ancestor_id')?members:[];
 if(table==='policies')data=[{id:'p1',agent_id:'member-0',premium:'200.10',status:'active'},{id:'p2',agent_id:'member-0',premium:'9999',status:'cancelled'},{id:'p3',agent_id:'member-1',premium:500,status:'issued'}];
 if(table==='earning_ledger')data=[{id:'e1',agent_id:'member-0',amount:'10.10'}];
 if(table==='earning_adjustments')data=[{id:'a1',earning_id:'e1',amount_delta:'2.20'}];
 if(table==='clawbacks')data=[{id:'c1',earning_id:'e1',amount:'1.05'}];
 return Promise.resolve({data:data.slice(bounds[0],bounds[1]+1),error:fail&&table==='policies'?{message:'offline'}:null}).then(resolve,reject);
 }};return q}};
 const api=load('src/app/api/partner/team/route.ts',{'@/lib/auth-server':{verifyRequestToken:async()=>({uid:'verified-user',role:'partner'})},'@/lib/supabase-server':{supabaseServer:()=>db}});
 return {calls,get:query=>api.GET(new NextRequest('https://example.test/api/partner/team?'+query))};
}
test('team totals include issued premiums and net commissions, scoped to known descendants',async()=>{
 const s=populatedTeam(),response=await s.get('sort=business&agent_id=attacker'),body=await response.json();assert.equal(response.status,200);assert.deepEqual(body.counts,[11,1,0]);assert.equal(body.total,12);assert.equal(body.members.length,10);assert.equal(body.members[0].member.id,'member-1');const row=body.members.find(r=>r.member.id==='member-0');assert.equal(row.business,200.1);assert.equal(row.commission,11.25);
 for(const call of s.calls.filter(c=>!['network_closure','agents'].includes(c.table))){assert.ok(call.filters.some(([k,v])=>['agent_id','earning.agent_id'].includes(k)&&v.length===12&&v.every(id=>id.startsWith('member-'))));}
});
test('team filters run before pagination and preserve unfiltered summary counts',async()=>{
 const s=populatedTeam(),filtered=await (await s.get('status=draft&search=9876543201')).json();assert.equal(filtered.total,1);assert.equal(filtered.members[0].member.id,'member-1');assert.deepEqual(filtered.counts,[11,1,0]);const second=await(await s.get('page=2')).json();assert.equal(second.members.length,2);assert.equal(second.page,2);const level=await(await s.get('level=2')).json();assert.equal(level.total,1);assert.equal(level.members[0].depth,2);
});
test('CSV exports all filtered results and neutralizes spreadsheet formulas',async()=>{
 const s=populatedTeam(),response=await s.get('export=1&sort=name'),csv=await response.text();assert.match(response.headers.get('content-type'),/text\/csv/);assert.equal(csv.split('\r\n').length,13);assert.ok(csv.includes('"\'=Formula"'));assert.ok(csv.includes('"200.1"'));const filtered=await(await s.get('export=1&status=draft')).text();assert.equal(filtered.split('\r\n').length,2);
});
test('financial query failure fails the team response instead of returning fabricated zeros',async()=>{assert.equal((await populatedTeam({fail:true}).get('')).status,500)});
