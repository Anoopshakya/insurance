import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("identity migration preserves references, blocks unsafe links, and can resume", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz, raw_app_meta_data jsonb);
      create table public.users(id text primary key, email text unique, updated_at timestamptz);
      create table public.user_roles(user_id text references public.users(id) on delete cascade, role_id text);
      create table public.agents(id int primary key, user_id text references public.users(id));
      create table public.audit_logs(entity_type text, entity_id uuid, actor_id text references public.users(id));
      insert into public.users values ('legacy-id', 'admin@example.test', now());
      insert into public.user_roles values ('legacy-id','super_admin');
      insert into public.agents values (1,'legacy-id');
      insert into public.audit_logs values ('agent','10000000-0000-0000-0000-000000000001','legacy-id');
      insert into auth.users values ('20000000-0000-0000-0000-000000000001','admin@example.test',null,'{"imported_application_id":"legacy-id"}');
    `);
    await db.exec(readFileSync("supabase/migrations/202609080001_auth_identity_migration.sql", "utf8"));
    await db.query("select migrate_application_identity($1,$2)", ["legacy-id", "20000000-0000-0000-0000-000000000001"]);
    for (const [table, column] of [["users","id"],["agents","user_id"],["user_roles","user_id"],["audit_logs","actor_id"]]) {
      assert.equal((await db.query("select " + column + " as id from " + table)).rows[0].id, "20000000-0000-0000-0000-000000000001");
    }
    assert.equal((await db.query("select role_id from user_roles")).rows[0].role_id, "super_admin");
    await db.query("select migrate_application_identity($1,$2)", ["legacy-id", "20000000-0000-0000-0000-000000000001"]);
    await db.exec(`
      insert into public.users values ('second-id','second@example.test',now());
      insert into auth.users values ('20000000-0000-0000-0000-000000000002','wrong@example.test',now(),'{}');
    `);
    await assert.rejects(db.query("select migrate_application_identity($1,$2)", ["second-id","20000000-0000-0000-0000-000000000002"]), /email does not match/);
    await db.exec("update auth.users set email='second@example.test',email_confirmed_at=null where id='20000000-0000-0000-0000-000000000002'");
    await assert.rejects(db.query("select migrate_application_identity($1,$2)", ["second-id","20000000-0000-0000-0000-000000000002"]), /verify its email/);
    assert.equal((await db.query("select count(*)::int as count from users where id='second-id'")).rows[0].count, 1);
    const privileges = await db.query("select has_function_privilege('anon','public.migrate_application_identity(text,uuid)','execute') as anon, has_function_privilege('authenticated','public.migrate_application_identity(text,uuid)','execute') as authenticated, has_function_privilege('service_role','public.migrate_application_identity(text,uuid)','execute') as service");
    assert.equal(privileges.rows[0].anon, false); assert.equal(privileges.rows[0].authenticated, false); assert.equal(privileges.rows[0].service, true);
  } finally { await db.close(); }
});
