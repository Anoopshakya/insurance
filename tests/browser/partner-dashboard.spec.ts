import {test,expect, type Page} from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const data={hasActivity:true,leads:7,customers:3,policiesSold:2,totalEarnings:950,paidEarnings:1000,unpaidEarnings:-50,premium:20000,renewalsDue:1,categories:[{name:"Health",count:2,percentage:100}],trend:Array.from({length:6},(_,i)=>({key:"2026-"+String(i+1).padStart(2,"0"),label:["Jan","Feb","Mar","Apr","May","Jun"][i],policies:i===5?2:0,earnings:i===5?950:0})),recentLeads:[{id:"lead-one",name:"Live Test Lead",contact:"9876543210",status:"new",created_at:"2026-06-15T00:00:00Z",product:"Health"}],updatedAt:"2026-06-15T00:00:00Z"};
async function mount(page:Page,theme="light") {
 const css=["src/app/appearance.css","src/app/partner/partner-dashboard.css","src/app/partner/partner-skeleton.css"].map(p=>fs.readFileSync(p,"utf8")).join("\n");
 await page.route("**/__dashboard_fixture",r=>r.fulfill({contentType:"text/html",body:'<html data-theme="'+theme+'"><style>body{margin:0}*{box-sizing:border-box}'+css+'</style><div class="pd-shell"><main class="pd-content" id="root"></main></div></html>'}));
 await page.goto("/__dashboard_fixture");
 await page.addScriptTag({path:path.resolve("node_modules/react/umd/react.development.js")});
 await page.addScriptTag({path:path.resolve("node_modules/react-dom/umd/react-dom.development.js")});
 const skeleton=ts.transpileModule(fs.readFileSync("src/components/partner/partner-skeleton.tsx","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const welcome=ts.transpileModule(fs.readFileSync("src/components/partner/partner-welcome.tsx","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const overview=ts.transpileModule(fs.readFileSync("src/components/partner/partner-overview.tsx","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 await page.addScriptTag({content:`const runtime={jsx:(t,p,k)=>React.createElement(t,{...p,key:k}),jsxs:(t,p,k)=>React.createElement(t,{...p,key:k}),Fragment:React.Fragment};
 const modules={react:React,"react/jsx-runtime":runtime,"next/link":{__esModule:true,default:p=>React.createElement("a",p)},"lucide-react":new Proxy({},{get:()=>(props)=>React.createElement("svg",{...props,width:props.size||24,height:props.size||24,"aria-hidden":true})}),"@/lib/supabase-client":{accessToken:async()=>"fixture-token"}};
 modules["next/image"]={__esModule:true,default:({priority,...p})=>React.createElement("img",p)};
 const require=n=>modules[n];const welcomeExports={};((exports)=>{${welcome}})(welcomeExports);modules["./partner-welcome"]=welcomeExports;const skeletonExports={};((exports)=>{${skeleton}})(skeletonExports);modules["./partner-skeleton"]=skeletonExports;
 const overviewExports={};((exports)=>{${overview}})(overviewExports);ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(overviewExports.PartnerOverview,{name:"Test Partner"}));`});
}
test("dashboard waits for live data and refresh replaces figures",async({page})=>{
 let calls=0;await page.route("**/api/partner/dashboard",async r=>{calls++;expect(r.request().headers().authorization).toBe("Bearer fixture-token");await new Promise(resolve=>setTimeout(resolve,300));await r.fulfill({json:{data:{...data,leads:calls===1?7:9}}});});
 await mount(page);await expect(page.getByRole("status")).toBeVisible();await expect(page.locator(".pd-stats article").first()).toContainText("7");await expect(page.getByText("Live Test Lead",{exact:true})).toBeVisible();await expect(page.locator(".pd-stats")).not.toContainText("248");await page.getByRole("button",{name:"Refresh",exact:true}).click();await expect(page.locator(".pd-stats article").first()).toContainText("9");
});
test("dashboard errors do not masquerade as empty data and can be retried",async({page})=>{
 let calls=0;await page.route("**/api/partner/dashboard",r=>{calls++;return r.fulfill(calls===1?{status:500,json:{error:"Temporary database failure"}}:{json:{data}})});
 await mount(page);await expect(page.getByRole("alert")).toContainText("Temporary database failure");await expect(page.locator(".pd-stats")).toHaveCount(0);await page.getByRole("button",{name:"Try again"}).click();await expect(page.locator(".pd-stats article").first()).toContainText("7");
});
test("empty mobile dashboard has honest states and no overflow in dark theme",async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.route("**/api/partner/dashboard",r=>r.fulfill({json:{data:{...data,hasActivity:false,leads:0,customers:0,policiesSold:0,totalEarnings:0,paidEarnings:0,unpaidEarnings:0,premium:0,renewalsDue:0,categories:[],recentLeads:[],trend:data.trend.map(m=>({...m,policies:0,earnings:0}))}}}));await mount(page,"dark");await expect(page.getByRole("heading",{name:"Welcome to MagikPolicy, Test Partner!"})).toBeVisible();await expect(page.getByRole("link",{name:"Create Your First Lead"})).toHaveAttribute("href","/partner/leads?create=1");await expect(page.locator(".pd-stats")).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:"test-results/live-dashboard-empty-mobile.png",fullPage:true});
});

test("populated mobile dashboard displays live category and net earnings",async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.route("**/api/partner/dashboard",r=>r.fulfill({json:{data}}));await mount(page,"dark");await expect(page.locator(".pd-stats article").first()).toContainText("7");await expect(page.locator(".pd-categories")).toContainText("100.0%");await expect(page.locator(".pd-live-summary")).toContainText(/-\D*50/);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const bar=page.locator(".pd-bars").last().locator("i");const bounds=await bar.boundingBox();const plot=await page.locator(".pd-bars").last().locator("div").boundingBox();expect(Math.abs(bounds!.y+bounds!.height-plot!.y-plot!.height)).toBeLessThan(2);await page.screenshot({path:"test-results/live-dashboard-mobile.png",fullPage:true});
});

test("welcome switches to reports after activity arrives",async({page})=>{let count=0;await page.route("**/api/partner/dashboard",r=>r.fulfill({json:{data:{...data,hasActivity:++count>1}}}));await mount(page);await expect(page.getByRole("heading",{name:/Welcome to MagikPolicy/})).toBeVisible();await page.getByRole("button",{name:"Refresh activity",exact:true}).click();await expect(page.locator(".pd-stats")).toBeVisible();await expect(page.locator(".partner-welcome-start")).toHaveCount(0);});
