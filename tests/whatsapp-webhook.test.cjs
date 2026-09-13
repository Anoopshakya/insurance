const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {NextRequest}=require('next/server');
function endpoint(token='test-verification-token') {
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/webhooks/whatsapp/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require,Buffer,process:{env:{META_WHATSAPP_VERIFY_TOKEN:token}}});
 return query=>exports.GET(new NextRequest('https://www.magikpolicy.com/api/webhooks/whatsapp?'+new URLSearchParams(query)));
}
const valid={'hub.mode':'subscribe','hub.verify_token':'test-verification-token','hub.challenge':'123456'};
test('Meta verification returns the exact plain-text challenge without authentication',async()=>{const response=await endpoint()(valid);assert.equal(response.status,200);assert.equal(await response.text(),'123456');assert.match(response.headers.get('content-type'),/text\/plain/);assert.equal(response.headers.get('cache-control'),'no-store')});
test('wrong, missing and same-length invalid tokens and invalid modes are rejected',async()=>{for(const change of [{'hub.verify_token':'wrong'},{'hub.verify_token':''},{'hub.verify_token':'Test-verification-token'},{'hub.mode':'other'}]){const response=await endpoint()({...valid,...change});assert.equal(response.status,403);assert.equal(await response.text(),'Verification failed')}});
test('missing challenge and missing server configuration fail explicitly',async()=>{assert.equal((await endpoint()({...valid,'hub.challenge':''})).status,400);assert.equal((await endpoint('')(valid)).status,503)});
