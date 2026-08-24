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
