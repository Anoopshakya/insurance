import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

// Run with node --env-file=.env scripts/migrate-auth-identities.mjs [--apply].
// No passwords or tokens are printed and no emails are sent.
const apply = process.argv.includes("--apply");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: rows, error } = await db.from("users").select("id,email,full_name,portal,status");
if (error) throw error;
if (apply) {
  const { error } = await db.rpc("migrate_application_identity", { legacy_id: "__migration_preflight__", auth_id: "00000000-0000-0000-0000-000000000000" });
  if (!error || error.code !== "P0001" || !error.message.includes("Application identity not found")) {
    throw new Error("Apply 202609080001_auth_identity_migration.sql before provisioning accounts.");
  }
}
const accounts = [];
for (let page = 1; ; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  accounts.push(...data.users);
  if (data.users.length < 1000) break;
}
const summary = { linked: 0, needProvisioning: 0, needRelinking: 0, missingEmail: 0, migrated: 0, failed: 0 };
for (const row of rows) {
  if (accounts.some(account => account.id === row.id)) { summary.linked++; continue; }
  if (!row.email) { summary.missingEmail++; continue; }
  let account = accounts.find(account => account.email?.toLowerCase() === row.email.toLowerCase());
  if (account) summary.needRelinking++; else summary.needProvisioning++;
  if (!apply) continue;
  try {
    if (!account) {
      const { data, error } = await db.auth.admin.createUser({
        email: row.email,
        password: randomBytes(32).toString("base64url"),
        email_confirm: false,
        user_metadata: { full_name: row.full_name },
        app_metadata: { imported_application_id: row.id },
        ...(row.status === "suspended" || row.status === "inactive" ? { ban_duration: "876000h" } : {}),
      });
      if (error || !data.user) throw error || new Error("Account creation failed");
      account = data.user;
      accounts.push(account);
    }
    const { error } = await db.rpc("migrate_application_identity", { legacy_id: row.id, auth_id: account.id });
    if (error) throw error;
    summary.migrated++;
  } catch (error) {
    summary.failed++;
    // Leave provisioned accounts intact: a network failure may follow a committed
    // transaction. Rerunning finds the same account and safely resumes linking.
    console.error("Identity migration failed for portal " + row.portal + ": " + error.message);
  }
}
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", ...summary }, null, 2));
if (summary.failed || summary.missingEmail) process.exitCode = 1;
