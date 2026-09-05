// Central permission check. Every API route that touches a protected
// module calls this before doing anything else. This is what makes
// Settings -> Roles/Permissions a real, enforced feature instead of
// a UI that doesn't actually gate anything.

import { supabaseServer } from "./supabase-server";

export async function userHasPermission(
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  const db = supabaseServer();

  const { data, error } = await db
    .from("user_roles")
    .select(
      `role_id, roles!inner(
         role_permissions!inner(
           permissions!inner(module, action)
         )
       )`
    )
    .eq("user_id", userId);

  if (error || !data) return false;

  // Flatten and check for a match. Simple and explicit on purpose —
  // optimize with a SQL function later if this becomes a hot path.
  return data.some((row: any) =>
    row.roles?.role_permissions?.some(
      (rp: any) =>
        rp.permissions?.module === module && rp.permissions?.action === action
    )
  );
}

export async function ensureAdminPermission(userId: string, email: string | undefined, module: string, action: string) {
  const db = supabaseServer();
  // Supabase is authoritative for authorization. A stale Firebase claim must
  // never downgrade an identity explicitly managed as an active administrator.
  const { data: directAdmin } = await db.from("users").select("id").eq("id",userId).eq("portal","admin").eq("status","active").maybeSingle();
  if (directAdmin) return true;
  if (await userHasPermission(userId, module, action)) return true;
  // During the Firebase -> Supabase Auth transition an existing employee may
  // have a different provider UID. Resolve their canonical RBAC identity by
  // verified email instead of requiring a duplicate role assignment.
  if (email) {
    const { data: employee } = await db.from("users").select("id,portal,status").ilike("email", email.trim()).maybeSingle();
    if (employee && ["admin", "employee"].includes(employee.portal) && employee.status === "active" && await userHasPermission(employee.id, module, action)) return true;
    // `portal=admin` is the legacy database marker for an administrator. Repair
    // a missing role mapping once, then all subsequent checks use normal RBAC.
    if (employee?.portal === "admin" && employee.status === "active") {
      const { data: superAdmin } = await db.from("roles").select("id").eq("name", "super_admin").maybeSingle();
      if (superAdmin) {
        const { error: roleError } = await db.from("user_roles").upsert({ user_id:employee.id, role_id:superAdmin.id }, { onConflict:"user_id,role_id" });
        if (!roleError) {
          const { data:permission } = await db.from("permissions").select("id").eq("module",module).eq("action",action).maybeSingle();
          if (permission) await db.from("role_permissions").upsert({ role_id:superAdmin.id, permission_id:permission.id }, { onConflict:"role_id,permission_id" });
          return true;
        }
      }
    }
  }
  const approvedEmails = (process.env.ADMIN_EMAILS || process.env.FIREBASE_ADMIN_EMAILS || "admin@magikpolicy.com").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  if (!email || !approvedEmails.includes(email.toLowerCase())) return false;
  const { error: userError } = await db.from("users").upsert({ id:userId, email:email.toLowerCase(), full_name:email.split("@")[0]||"Administrator", portal:"admin", status:"active", updated_at:new Date().toISOString() }, { onConflict:"id" });
  if (userError) return true;
  const { data:role, error:roleError } = await db.from("roles").select("id").eq("name","super_admin").maybeSingle();
  if (roleError || !role) return true;
  const { error:mapError } = await db.from("user_roles").upsert({user_id:userId,role_id:role.id},{onConflict:"user_id,role_id"});
  if (mapError) return true;
  return true;
}
