const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,imports={}) { const exports={}; vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021}}).outputText,{exports,require:n=>imports[n]||require(n),Date,FormData,File,Buffer,crypto}); return exports; }
const schemas=load('src/lib/partners/onboarding.ts');
const personal={dateOfBirth:'1990-01-01',gender:'female',fatherOrSpouseName:'Test Parent',occupation:'Advisor',addressLine1:'123 Main Road',addressLine2:'Apartment 2',city:'Mumbai',state:'Maharashtra',postalCode:'400001'};
test('personal step saves without identity or banking; validates age and address',()=>{
 assert.equal(schemas.personalSchema.safeParse(personal).success,true);
 assert.equal(schemas.personalSchema.safeParse({...personal,dateOfBirth:'2020-01-01'}).success,false);
 assert.equal(schemas.personalSchema.safeParse({...personal,addressLine1:''}).success,false);
 assert.equal(schemas.personalSchema.safeParse({...personal,postalCode:'123'}).success,false);
});
test('identity normalizes PAN and Aadhaar and bank confirmation must match',()=>{
 assert.equal(schemas.identitySchema.parse({panNumber:'abcde1234f',aadhaarNumber:'1234 5678 9012'}).aadhaarNumber,'123456789012');
 const bank={accountHolder:'Test Partner',bankName:'Test Bank',branchName:'Mumbai',accountType:'savings',accountNumber:'1234567890',confirmAccountNumber:'1234567890',ifsc:'HDFC0001234'};
 assert.equal(schemas.bankSchema.safeParse(bank).success,true);
 assert.equal(schemas.bankSchema.safeParse({...bank,confirmAccountNumber:'1234567891'}).success,false);
});
function endpoint(identity,kyc='not_started') {
 const writes=[];
 const db={from:table=>{const q={select:()=>q,eq:()=>q,in:()=>q,single:async()=>({data:{id:'own-agent',status:'pending',kyc_status:kyc}}),maybeSingle:async()=>({data:null}),upsert:async row=>{writes.push({table,row});return {error:null}},then:resolve=>Promise.resolve({data:[],error:null}).then(resolve)};return q}};
 const api=load('src/app/api/partner/onboarding/complete/route.ts',{'next/server':{NextResponse:{json:(body,options)=>({body,...options})}},'@/lib/auth-server':{verifyRequestToken:async()=>identity},'@/lib/supabase-server':{supabaseServer:()=>db},'@/lib/partners/onboarding':schemas});
 const request=(step,values={})=>({headers:{get:()=> 'Bearer token'},formData:async()=>{const data=new FormData();data.set('step',step);for(const [key,value] of Object.entries(values))data.set(key,value);return data}});
 return {api,writes,request};
}
test('profile API rejects unauthenticated and non-partner access',async()=>{for(const user of [null,{uid:'user',role:'customer'}]){const s=endpoint(user);assert.equal((await s.api.POST(s.request('1',personal))).status,403);assert.equal((await s.api.GET(s.request('1'))).status,403);assert.equal(s.writes.length,0)}});
test('personal next persists both address lines for the authenticated agent only',async()=>{const s=endpoint({uid:'user',role:'partner'});assert.equal((await s.api.POST(s.request('1',{...personal,agent_id:'other-agent'}))).body.ok,true);assert.equal(s.writes[0].row.agent_id,'own-agent');assert.equal(s.writes[0].row.address_line1,personal.addressLine1);assert.equal(s.writes[0].row.address_line2,personal.addressLine2);assert.equal(s.writes.length,1)});
test('cannot skip personal step or resubmit a submitted profile',async()=>{const s=endpoint({uid:'user',role:'partner'});assert.equal((await s.api.POST(s.request('3'))).status,400);assert.equal(s.writes.length,0);const locked=endpoint({uid:'user',role:'partner'},'submitted');assert.equal((await locked.api.POST(locked.request('1',personal))).status,409)});
