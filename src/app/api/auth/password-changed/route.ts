import { NextRequest, NextResponse } from "next/server";
import { adminAuth, verifyRequestToken } from "@/lib/firebase-admin";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const user = await adminAuth.getUser(decoded.uid);
  await adminAuth.setCustomUserClaims(decoded.uid, { ...user.customClaims, mustChangePassword: false });
  const db = supabaseServer();
  await db.from("audit_logs").insert({ entity_type: "user", entity_id: decoded.uid, action: "password_changed", actor_id: decoded.uid });
  return NextResponse.json({ ok: true });
}
