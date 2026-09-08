import { supabaseServer } from "./supabase-server";

export async function userHasPermission(userId: string, module: string, action: string): Promise<boolean> {
  const db = supabaseServer();
  const { data: identity, error: identityError } = await db.from("users").select("portal,status").eq("id", userId).maybeSingle();
  if (identityError || !identity || identity.status !== "active") return false;
  // Retain the explicit administrator marker used by the existing role-management UI.
  if (identity.portal === "admin") return true;
  const { data, error } = await db.from("user_roles").select(
    "role_id, roles!inner(role_permissions!inner(permissions!inner(module, action)))"
  ).eq("user_id", userId);
  if (error || !data) return false;
  return data.some((row: any) => row.roles?.role_permissions?.some(
    (permission: any) => permission.permissions?.module === module && permission.permissions?.action === action
  ));
}

export async function ensureAdminPermission(userId: string, _email: string | undefined, module: string, action: string) {
  return userHasPermission(userId, module, action);
}
