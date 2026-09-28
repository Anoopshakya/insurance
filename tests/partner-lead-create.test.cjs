const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {NextRequest,NextResponse}=require('next/server');
const uuid='11111111-1111-4111-8111-111111111111';
function setup(status,role='partner'){
 const inserts=[];
 const db={from(table){const q={select:()=>q,eq:()=>q,insert:row=>{inserts.push(row);return q},maybeSingle:async()=>({data:{id:uuid}}),single:async()=>({data:table==='agents'?{id:uuid,status}:{id:uuid}})};return q}};
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/partner/leads/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>({'next/server':{NextRequest,NextResponse},zod:require('zod'),'@/lib/auth-server':{verifyRequestToken:async()=>({uid:'user',role})},'@/lib/supabase-server':{supabaseServer:()=>db}})[n]});
 return {inserts,post:()=>exports.POST(new NextRequest('https://site.test/api/partner/leads',{method:'POST',body:JSON.stringify({name:'Test Customer',contact:'9876543210',productSectorId:uuid,productTypeId:uuid,purchaseTimeline:'immediately'})}))};
}
test('new and approved partners can create their own leads',async()=>{for(const status of ['draft','submitted','under_review','approved','active']){const s=setup(status);assert.equal((await s.post()).status,201,status);assert.equal(s.inserts[0].agent_id,uuid)}});
test('restricted accounts and other portals cannot create partner leads',async()=>{for(const status of ['suspended','rejected','deactivated','unknown']){const s=setup(status);assert.equal((await s.post()).status,403,status);assert.equal(s.inserts.length,0)}assert.equal((await setup('active','customer').post()).status,403)});
