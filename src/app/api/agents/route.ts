// Reference implementation of the pattern every protected route follows:
// 1. Verify the Firebase ID token   -> who is this, really?
// 2. Check role_permissions          -> are they allowed to do this?
// 3. Only then touch Supabase        -> and log to audit_logs if it mutates data.
//
// Copy this structure for /api/leads, /api/policies, /api/commission/rules, etc.

import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/firebase-admin";
import { userHasPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const allowed = await userHasPermission(decoded.uid, "agents", "view");
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const db = supabaseServer();
  const { data, error } = await db.from("agents").select("*").limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const allowed = await userHasPermission(decoded.uid, "agents", "create");
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const db = supabaseServer();

  const { data, error } = await db
    .from("agents")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Every mutation on a business-critical table gets an audit trail.
  await db.from("audit_logs").insert({
    entity_type: "agent",
    entity_id: data.id,
    action: "create",
    actor_id: decoded.uid,
    after_state: data,
  });

  return NextResponse.json({ data }, { status: 201 });
}
