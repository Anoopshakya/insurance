// Server-only Firebase Admin init. Used to verify ID tokens on every
// API route before touching Supabase, so RBAC checks always start from
// a verified identity, not a client-supplied user id.

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { supabaseServer } from "./supabase-server";

function cleanPrivateKey(value: string) {
  let key = value.trim().replace(/\\n/g, "\n");
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  )
    key = key.slice(1, -1);
  return key;
}

function getAdminAuth(): Auth {
  if (getApps().length) return getAuth(getApp());
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!projectId || !clientEmail || !rawPrivateKey)
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.",
    );
  const privateKey = cleanPrivateKey(rawPrivateKey);
  if (
    !privateKey.includes("BEGIN PRIVATE KEY") ||
    !privateKey.includes("END PRIVATE KEY")
  )
    throw new Error(
      "FIREBASE_ADMIN_PRIVATE_KEY is invalid. Paste the complete private_key from the Firebase service-account JSON.",
    );
  return getAuth(
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }),
  );
}

// Keep initialization out of module evaluation. Next/Vercel imports API modules while
// collecting build data, when runtime-only secrets may be unavailable.
export const adminAuth = new Proxy({} as Auth, {
  get(_target, property) {
    const auth = getAdminAuth();
    const value = Reflect.get(auth, property, auth);
    if (property === "getUser")
      return async (uid: string) => {
        try {
          return await auth.getUser(uid);
        } catch (error) {
          const db = supabaseServer(),
            { data } = await db.auth.admin.getUserById(uid);
          if (!data.user) throw error;
          return {
            uid: data.user.id,
            email: data.user.email,
            phoneNumber: data.user.phone,
            displayName:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name,
            customClaims: {},
          } as any;
        }
      };
    if (property === "setCustomUserClaims")
      return async (uid: string, claims: Record<string, unknown>) => {
        try {
          return await auth.setCustomUserClaims(uid, claims);
        } catch {
          return;
        }
      };
    if (property === "updateUser")
      return async (uid: string, input: any) => {
        try {
          return await auth.updateUser(uid, input);
        } catch (error) {
          const db = supabaseServer(),
            attributes: any = {};
          if (input.displayName)
            attributes.user_metadata = { full_name: input.displayName };
          if (input.disabled === true) attributes.ban_duration = "876000h";
          if (input.disabled === false) attributes.ban_duration = "none";
          const { data, error: updateError } =
            await db.auth.admin.updateUserById(uid, attributes);
          if (updateError) throw error;
          return data.user as any;
        }
      };
    if (property === "deleteUser")
      return async (uid: string) => {
        try {
          return await auth.deleteUser(uid);
        } catch {
          await supabaseServer().auth.admin.deleteUser(uid);
        }
      };
    return typeof value === "function" ? value.bind(auth) : value;
  },
});

// Verifies the Firebase ID token sent from the client (Authorization: Bearer <token>)
export async function verifyRequestToken(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  const db = supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser(token);
  if (user) {
    const [{ data: roleRows }, { data: identity }] = await Promise.all([
      db.from("user_roles").select("roles(name)").eq("user_id", user.id),
      db.from("users").select("portal").eq("id", user.id).maybeSingle(),
    ]);
    const roles = (roleRows || [])
      .map((row: any) => row.roles?.name)
      .filter(Boolean);
    const portalRole =
      identity?.portal === "agent" ? "partner" : identity?.portal;
    return {
      uid: user.id,
      sub: user.id,
      email: user.email,
      email_verified_at: user.email_confirmed_at,
      email_verified: Boolean(user.email_confirmed_at),
      phone_number: user.phone,
      role:
        roles.includes("partner") || roles.includes("agent")
          ? "partner"
          : roles.includes("customer")
            ? "customer"
            : roles.includes("employee")
              ? "employee"
              : roles.includes("super_admin")
                ? "super_admin"
                : roles[0] || portalRole,
    } as any;
  }
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.role === "agent") decoded.role = "partner";
    return decoded;
  } catch {
    return null;
  }
}
