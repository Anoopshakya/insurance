import { supabaseServer } from "./supabase-server";

export type RequestIdentity = {
  uid: string;
  email?: string;
  email_verified: boolean;
  phone_number?: string;
  role?: string;
};

// Only tokens verified by Supabase Auth are accepted. Roles come from the database.
export async function verifyRequestToken(authHeader: string | null): Promise<RequestIdentity | null> {
  if (!authHeader?.startsWith("Bearer ") || !authHeader.slice(7).trim()) return null;
  const db = supabaseServer();
  const { data: { user }, error } = await db.auth.getUser(authHeader.slice(7).trim());
  if (error || !user) return null;
  const [{ data: roleRows, error: roleError }, { data: identity, error: identityError }] = await Promise.all([
    db.from("user_roles").select("roles(name)").eq("user_id", user.id),
    db.from("users").select("portal,status").eq("id", user.id).maybeSingle(),
  ]);
  if (roleError || identityError) throw new Error("Unable to load account permissions.");
  if (identity && ["suspended", "inactive"].includes(identity.status)) return null;
  const roles = (roleRows || []).flatMap((row) => {
    const related = Array.isArray(row.roles) ? row.roles : [row.roles];
    return related.filter(Boolean).map(role => role.name);
  });
  const portalRole = identity?.portal === "agent" ? "partner" : identity?.portal;
  return {
    uid: user.id,
    email: user.email,
    email_verified: Boolean(user.email_confirmed_at),
    phone_number: user.phone,
    role: portalRole || (["super_admin", "employee", "partner", "customer"].find(role => roles.includes(role))) || (roles.includes("agent") ? "partner" : undefined),
  };
}
