const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, imports) {
 const exports = {};
 const code = ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{exports,require:name=>{if(name in imports)return imports[name];throw Error(name);},console});return exports;
}
const schema = load("src/lib/quote-request.ts",{zod:require("zod")});
const catalogue = load("src/components/website/website-products.ts",{});
const base = {customerName:"Test Customer",mobile:"9876543210",productType:"health"};
test("all product pages and their aliases select a valid quotation category",()=>{
 for(const product of catalogue.products){assert.equal(schema.quoteRequestSchema.safeParse({...base,productType:product.type}).success,true);for(const slug of [product.slug,...product.aliases])assert.equal(catalogue.productForPath("/products/"+slug).type,product.type);}
 assert.equal(catalogue.productForPath("/about"),undefined);assert.equal(catalogue.productForPath("/products/missing"),undefined);
});
test("quotation validates contact data and normalizes Indian country codes",()=>{
 assert.equal(schema.quoteRequestSchema.parse({...base,mobile:"+91 98765 43210"}).mobile,"9876543210");
 for(const mobile of ["1234567890","98765","letters9876543210","+44 9876543210"])assert.equal(schema.quoteRequestSchema.safeParse({...base,mobile}).success,false);
 assert.equal(schema.quoteRequestSchema.safeParse({...base,customerName:" "}).success,false);
 assert.equal(schema.quoteRequestSchema.safeParse({...base,productType:"unknown"}).success,false);
 assert.equal(schema.quoteRequestSchema.safeParse({...base,website:"spam"}).success,false);
});
function endpoint(failure=false){
 let saved;
 const db={from:()=>({insert:row=>{saved=row;return{select:()=>({single:async()=>failure?{error:Error("database unavailable")}:{data:{id:"saved-id"}}})};}})};
 const api=load("src/app/api/public/quote-requests/route.ts",{"zod":require("zod"),"@/lib/quote-request":schema,"@/lib/supabase-server":{supabaseServer:()=>db},"next/server":{NextResponse:{json:(body,options)=>({body,status:options?.status||200})}}});
 return{api,saved:()=>saved};
}
test("quotation API saves the selected product and originating page",async()=>{
 const route=endpoint();const result=await route.api.POST({json:async()=>({...base,productType:"travel",sourcePath:"/products/travel-insurance"})});
 assert.equal(result.status,201);assert.equal(route.saved().product_type,"travel");assert.equal(route.saved().source,"website:/products/travel-insurance");
});
test("existing homepage submissions retain their source",async()=>{
 const route=endpoint();assert.equal((await route.api.POST({json:async()=>base})).status,201);assert.equal(route.saved().source,"homepage_quote_widget");
});
test("invalid enquiries are rejected before database writes",async()=>{
 const route=endpoint();assert.equal((await route.api.POST({json:async()=>({...base,productType:"unknown"})})).status,400);assert.equal(route.saved(),undefined);
});
test("a database failure cannot return a successful quotation",async()=>{
 const route=endpoint(true);assert.equal((await route.api.POST({json:async()=>base})).status,500);
});

test("optional quotation email is validated and saved without losing selections",async()=>{
 const route=endpoint();assert.equal((await route.api.POST({json:async()=>({...base,email:"quote@example.com",selections:{product:"Health Insurance"}})})).status,201);assert.equal(route.saved().selections.email,"quote@example.com");assert.equal(route.saved().selections.product,"Health Insurance");
 const invalid=endpoint();assert.equal((await invalid.api.POST({json:async()=>({...base,email:"invalid"})})).status,400);assert.equal(invalid.saved(),undefined);
 assert.equal(schema.quoteRequestSchema.safeParse({...base,email:""}).success,true);
});
