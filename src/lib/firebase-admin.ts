// Server-only Firebase Admin init. Used to verify ID tokens on every
// API route before touching Supabase, so RBAC checks always start from
// a verified identity, not a client-supplied user id.

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

function cleanPrivateKey(value: string) {
  let key = value.trim().replace(/\\n/g, "\n");
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) key = key.slice(1, -1);
  return key;
}

function getAdminAuth(): Auth {
  if (getApps().length) return getAuth(getApp());
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!projectId || !clientEmail || !rawPrivateKey) throw new Error("Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.");
  const privateKey = cleanPrivateKey(rawPrivateKey);
  if (!privateKey.includes("BEGIN PRIVATE KEY") || !privateKey.includes("END PRIVATE KEY")) throw new Error("FIREBASE_ADMIN_PRIVATE_KEY is invalid. Paste the complete private_key from the Firebase service-account JSON.");
  return getAuth(initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }));
}

// Keep initialization out of module evaluation. Next/Vercel imports API modules while
// collecting build data, when runtime-only secrets may be unavailable.
export const adminAuth = new Proxy({} as Auth, {
  get(_target, property) {
    const auth = getAdminAuth();
    const value = Reflect.get(auth, property, auth);
    return typeof value === "function" ? value.bind(auth) : value;
  },
});

// Verifies the Firebase ID token sent from the client (Authorization: Bearer <token>)
export async function verifyRequestToken(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}
