// Server-only Firebase Admin init. Used to verify ID tokens on every
// API route before touching Supabase, so RBAC checks always start from
// a verified identity, not a client-supplied user id.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = getAuth();

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
