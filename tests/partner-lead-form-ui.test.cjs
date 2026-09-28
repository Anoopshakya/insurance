const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const {chromium}=require('@playwright/test');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.React}}).outputText;
test('mobile partner lead form shows errors and submits from a clipped dashboard',async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:640},isMobile:true,hasTouch:true});
  await page.setContent('<meta name="viewport" content="width=device-width, initial-scale=1"><div style="transform:translateZ(0);overflow:hidden;height:100px"><div id="root"></div></div>');
  await page.addStyleTag({path:'src/app/partner/partner-leads.css'});
  await page.addScriptTag({path:'node_modules/react/umd/react.development.js'});
  await page.addScriptTag({path:'node_modules/react-dom/umd/react-dom.development.js'});
  await page.evaluate(()=>{
   window.saved=0;window.requests=[];window.fail=true;
   window.modules={react:React,'react-dom':ReactDOM,'@/lib/supabase-client':{accessToken:async()=>'token'}};
   window.fetch=async(url,options={})=>{
    if(options.method==='POST'){window.requests.push(JSON.parse(options.body));return {ok:!window.fail,status:window.fail?400:201,json:async()=>window.fail?{error:'Please check the lead details.'}:{data:{id:'lead-1'}}};}
    return {ok:true,json:async()=>({data:[],sectors:[{id:'sector',name:'Health'}],productTypes:[{id:'type',category_id:'sector',name:'Family'}]})};
   };
  });
  await page.addScriptTag({content:`{const exports={};const require=n=>window.modules[n]||{};${compile('src/components/lead-customer-fields.tsx')};window.modules['@/components/lead-customer-fields']=exports;}`});
  await page.addScriptTag({content:`{const exports={};const require=n=>window.modules[n]||{};${compile('src/components/partner/lead-form.tsx')};ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(exports.LeadForm,{close:()=>{},saved:()=>window.saved++}));}`});
  await page.getByRole('button',{name:'Save Lead',exact:true}).tap();
  assert.match(await page.getByRole('alert').innerText(),/10-digit mobile/);
  await page.locator('input[name=name]').fill('Test Customer');
  await page.locator('input[name=contact]').fill('9876543210');
  await page.locator('select[name=productSectorId]').selectOption('sector');
  await page.locator('select[name=productTypeId]').selectOption('type');
  await page.locator('select[name=purchaseTimeline]').selectOption('immediately');
  await page.getByRole('button',{name:'Save Lead',exact:true}).tap();
  await page.getByRole('alert').filter({hasText:'Please check the lead details.'}).waitFor();
  await page.evaluate(()=>window.fail=false);
  await page.getByRole('button',{name:'Save Lead',exact:true}).tap();
  await page.waitForFunction(()=>window.saved===1);
  assert.equal((await page.evaluate(()=>window.requests)).length,2);
 }finally{await browser.close();}
});
