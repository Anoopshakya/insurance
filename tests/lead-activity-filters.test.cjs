const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(path,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText,{exports,require:n=>imports[n],Date});return exports}
const helpers=load('src/lib/lead-activity.ts'),filters=load('src/components/lead-filters.tsx',{'@/lib/lead-activity':helpers,react:{}});
test('next follow-up ignores finished records and closed leads; dates use IST',()=>{const row={status:'qualified',followups:[{status:'completed',scheduled_at:'2026-01-01T00:00:00Z'},{status:'scheduled',scheduled_at:'2026-09-29T20:00:00Z'},{status:'cancelled',scheduled_at:'2026-02-01T00:00:00Z'}]};assert.equal(helpers.indiaDay(helpers.nextFollowup(row).scheduled_at),'2026-09-30');assert.equal(helpers.nextFollowup({...row,status:'converted'}),null);assert.equal(helpers.nextFollowup({...row,status:'lost'}),null)});
test('overdue, today and ownership filters use pending records',()=>{const row={status:'new',created_at:new Date().toISOString(),agent:{user_id:'owner'},followups:[{status:'scheduled',scheduled_at:new Date(Date.now()-60000).toISOString()}]};assert.ok(filters.matchesLeadFilters(row,{quick:'overdue'},'owner'));assert.ok(filters.matchesLeadFilters(row,{quick:'today'},'owner'));assert.ok(!filters.matchesLeadFilters(row,{quick:'mine'},'other'));assert.ok(!filters.matchesLeadFilters({...row,status:'lost'},{quick:'overdue'},'owner'))});

const scheduled=(at,status='scheduled')=>({status:'qualified',followups:[{status,scheduled_at:at}]});
test('admin month filter uses India month boundaries while partner retains daily filtering',()=>{
 const row=scheduled('2026-09-30T18:30:00Z');
 assert.ok(filters.matchesLeadFilters(row,{followup:'2026-10'},''));
 assert.ok(!filters.matchesLeadFilters(row,{followup:'2026-09'},''));
 assert.ok(filters.matchesLeadFilters(row,{followup:'2026-10-01'},'',true));
 assert.ok(!filters.matchesLeadFilters(scheduled('2026-10-01T00:00:00Z','completed'),{followup:'2026-10'},''));
});
test('next seven days includes today through today plus seven in IST',()=>{
 const now=new Date('2026-10-02T05:00:00Z');
 for(const at of ['2026-10-01T18:30:00Z','2026-10-09T18:29:59Z'])assert.ok(filters.matchesLeadFilters(scheduled(at),{quick:'next7days'},'',false,now),at);
 for(const at of ['2026-10-01T18:29:59Z','2026-10-09T18:30:00Z'])assert.ok(!filters.matchesLeadFilters(scheduled(at),{quick:'next7days'},'',false,now),at);
 for(const status of ['cancelled','completed'])assert.ok(!filters.matchesLeadFilters(scheduled('2026-10-02T05:00:00Z',status),{quick:'next7days'},'',false,now));
});
test('rolling window crosses year boundaries and ignores older overdue follow-ups',()=>{
 const now=new Date('2026-12-30T18:30:00Z');
 const row=scheduled('2026-12-01T10:00:00Z');row.followups.push({status:'scheduled',scheduled_at:'2027-01-07T18:29:59Z'});
 assert.ok(filters.matchesLeadFilters(row,{quick:'next7days'},'',false,now));
 assert.ok(!filters.matchesLeadFilters({...row,status:'converted'},{quick:'next7days'},'',false,now));
 assert.ok(!filters.matchesLeadFilters(scheduled('2027-01-07T18:30:00Z'),{quick:'next7days'},'',false,now));
});
