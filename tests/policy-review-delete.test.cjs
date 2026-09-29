const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
test('review history cascades while financial records still protect a policy',async()=>{
 const db=new PGlite();try{
 await db.exec(`create table policies(id uuid primary key);create table policy_review_history(id int primary key,policy_id uuid not null references policies(id));create table earning_ledger(policy_id uuid references policies(id));`);
 await db.exec(fs.readFileSync('supabase/migrations/202609280001_policy_review_history_delete.sql','utf8'));
 const id='11111111-1111-4111-8111-111111111111';
 await db.query('insert into policies values ($1)',[id]);await db.query('insert into policy_review_history values (1,$1)',[id]);
 await db.query('insert into earning_ledger values ($1)',[id]);
 await assert.rejects(db.query('delete from policies where id=$1',[id]),/foreign key/);
 assert.equal((await db.query('select * from policy_review_history')).rows.length,1);
 await db.exec('delete from earning_ledger');await db.query('delete from policies where id=$1',[id]);
 assert.equal((await db.query('select * from policy_review_history')).rows.length,0);
 }finally{await db.close()}
});
