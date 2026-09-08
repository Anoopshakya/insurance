const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, imports, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require: name => { if (!(name in imports)) throw Error("Unexpected import: " + name); return imports[name]; }, process: { env: {} }, setTimeout, clearTimeout, URLSearchParams, ...globals });
  return exports;
}
function server({ user = { id: "auth-id", email: "user@example.test", email_confirmed_at: "2026-09-08", user_metadata: { role: "super_admin" } }, identity = { portal: "partner", status: "active" }, roleError = null, authError = null } = {}) {
  let calls = 0;
  const db = {
    auth: { getUser: async () => { calls++; return { data: { user }, error: authError }; } },
    from: name => ({ select: () => ({ eq: () => name === "users" ? { maybeSingle: async () => ({ data: identity }) } : Promise.resolve({ data: [{ roles: { name: "partner" } }], error: roleError }) }) }),
  };
  return { api: load("src/lib/auth-server.ts", { "./supabase-server": { supabaseServer: () => db } }), calls: () => calls };
}
test("missing, malformed, and empty bearer headers never query Auth", async () => {
  const s = server(); for (const value of [null, "", "Basic x", "Bearer "]) assert.equal(await s.api.verifyRequestToken(value), null); assert.equal(s.calls(), 0);
});
test("an unverified token is rejected without trusting its payload", async () => {
  const s = server({ user: null, authError: { message: "invalid JWT" } }); assert.equal(await s.api.verifyRequestToken("Bearer old-provider-token"), null);
});
test("verified identity uses database portal, not editable user metadata", async () => {
  const s = server(); const user = await s.api.verifyRequestToken("Bearer verified"); assert.equal(user.uid, "auth-id"); assert.equal(user.role, "partner");
});
test("suspended and inactive application identities are rejected", async () => {
  for (const status of ["suspended", "inactive"]) assert.equal(await server({ identity: { portal: "admin", status } }).api.verifyRequestToken("Bearer verified"), null);
});
test("permission database failures do not grant access", async () => {
  await assert.rejects(server({ roleError: { message: "offline" } }).api.verifyRequestToken("Bearer verified"), /permissions/);
});
test("RBAC denies inactive admins and email allowlists cannot grant access", async () => {
  for (const identity of [null, { portal: "admin", status: "suspended" }]) {
    const db = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: identity }) }) }) }) };
    const api = load("src/lib/rbac.ts", { "./supabase-server": { supabaseServer: () => db } });
    assert.equal(await api.ensureAdminPermission("id", "admin@magikpolicy.com", "system", "manage_roles"), false);
  }
});
function client(auth, globals) { return load("src/lib/supabase-client.ts", { "@supabase/ssr": { createBrowserClient: () => ({ auth }) } }, globals); }
test("session callbacks run outside the synchronous auth notification", async () => {
  let notify, unsubscribed = false, inside = false, called = false;
  const api = client({ onAuthStateChange: cb => { notify = cb; return { data: { subscription: { unsubscribe: () => { unsubscribed = true; } } } }; } });
  const stop = api.subscribeSession(async () => { assert.equal(inside, false); called = true; }, error => { throw error; });
  inside = true; notify("SIGNED_IN", {}); assert.equal(called, false); inside = false;
  await new Promise(resolve => setTimeout(resolve, 10)); assert.equal(called, true); stop(); assert.equal(unsubscribed, true);
});
test("unsubscribing cancels pending auth callbacks", async () => {
  let notify, called = false;
  const api = client({ onAuthStateChange: cb => { notify = cb; return { data: { subscription: { unsubscribe() {} } } }; } });
  const stop = api.subscribeSession(() => { called = true; }, () => {}); notify("SIGNED_IN", {}); stop();
  await new Promise(resolve => setTimeout(resolve, 10)); assert.equal(called, false);
});
test("session callback rejections reach the error handler", async () => {
  let notify, error;
  const api = client({ onAuthStateChange: cb => { notify = cb; return { data: { subscription: { unsubscribe() {} } } }; } });
  const stop = api.subscribeSession(async () => { throw Error("offline"); }, caught => { error = caught; }); notify("SIGNED_IN", {});
  await new Promise(resolve => setTimeout(resolve, 10)); assert.equal(error.message, "offline"); stop();
});
test("password update requires successful current-password verification", async () => {
  let updated = false;
  const api = client({ getUser: async () => ({ data: { user: { email: "user@example.test" } } }), signInWithPassword: async () => ({ error: Error("wrong password") }), updateUser: async () => { updated = true; return {}; } });
  await assert.rejects(api.changePassword("wrong", "a-new-password"), /wrong password/); assert.equal(updated, false);
});
test("password update errors are surfaced", async () => {
  const api = client({ getUser: async () => ({ data: { user: { email: "user@example.test" } } }), signInWithPassword: async () => ({}), updateUser: async () => ({ error: Error("password rejected") }) });
  await assert.rejects(api.changePassword("current", "new"), /password rejected/);
});
test("server-created email link exchanges token pair and removes URL secrets", async () => {
  let credentials, cleaned = false;
  const api = client({ setSession: async value => { credentials = value; return { data: { session: { access_token: "verified" } } }; } }, { location: { pathname: "/auth/callback", search: "", hash: "#access_token=access&refresh_token=refresh" }, history: { replaceState: () => { cleaned = true; } } });
  assert.equal((await api.completeAuthRedirect()).access_token, "verified"); assert.equal(credentials.refresh_token, "refresh"); assert.equal(cleaned, true);
});
test("invalid recovery links cannot fall back to a prior session", async () => {
  let called = false;
  const api = client({ getSession: async () => { called = true; return { data: { session: {} } }; } }, { location: { search: "?error_description=Expired", hash: "" } });
  await assert.rejects(api.completeAuthRedirect(), /Expired/); assert.equal(called, false);
});
test("browser-created recovery links use the SDK PKCE session", async () => {
  const api = client({ initialize: async () => ({}), getSession: async () => ({ data: { session: { access_token: "pkce" } } }) }, { location: { search: "?code=one-time-code", hash: "" } });
  assert.equal((await api.completeAuthRedirect()).access_token, "pkce");
});

test("a failed PKCE exchange cannot use an unrelated existing session", async () => {
  let checked = false;
  const api = client({ initialize: async () => ({ error: Error("expired code") }), getSession: async () => { checked = true; return { data: { session: {} } }; } }, { location: { search: "?code=expired", hash: "" } });
  await assert.rejects(api.completeAuthRedirect(), /expired code/); assert.equal(checked, false);
});
