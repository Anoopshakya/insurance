import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
test("product migration preserves existing enquiries and supports every category",async()=>{
 const db=new PGlite();try{
 await db.exec("create table website_quote_requests(product_type text not null check(product_type in ('health','motor','term')));insert into website_quote_requests values('health');");
 const sql=readFileSync("supabase/migrations/202609080002_website_quote_products.sql","utf8");await db.exec(sql);await db.exec(sql);
 for(const type of ['motor','term','life','travel','investment','car','bike','family','personal-accident'])await db.query("insert into website_quote_requests values($1)",[type]);
 assert.equal((await db.query("select count(*)::int as count from website_quote_requests")).rows[0].count,10);
 await assert.rejects(db.query("insert into website_quote_requests values($1)",['unknown']),/check constraint/);
 }finally{await db.close();}
});
