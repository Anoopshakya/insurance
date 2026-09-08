import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase-server";
export async function POST(req: NextRequest) {
  const user = await verifyRequestToken(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { error } = await supabaseServer().from("audit_logs").insert({ entity_type: "user", entity_id: user.uid, action: "password_changed", actor_id: user.uid });
  if (error) return NextResponse.json({ error: "Could not record password change." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
