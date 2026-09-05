import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/firebase-admin";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded || decoded.role !== "partner")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const db = supabaseServer();
  const { data: agent, error: agentError } = await db
    .from("agents")
    .select("id,kyc_status")
    .eq("user_id", decoded.uid)
    .single();
  if (agentError)
    return NextResponse.json({ error: agentError.message }, { status: 400 });

  if (agent.kyc_status === "not_started") {
    const now = new Date().toISOString();
    const { error } = await db
      .from("agents")
      .update({ kyc_status: "skipped", updated_at: now })
      .eq("id", agent.id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    await db.from("audit_logs").insert({
      entity_type: "agent",
      entity_id: agent.id,
      action: "profile_setup_skipped",
      actor_id: decoded.uid,
      after_state: { kyc_status: "skipped" },
    });
  }

  return NextResponse.json({ ok: true });
}
