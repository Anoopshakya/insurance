import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRequestToken } from "@/lib/firebase-admin";
import { ensureAdminPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";

async function allowed(request: NextRequest, action: string) {
  const user = await verifyRequestToken(request.headers.get("authorization"));
  return user && await ensureAdminPermission(user.uid, user.email, "leads", action);
}

export async function GET(request: NextRequest) {
  if (!(await allowed(request, "view"))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const db = supabaseServer();
  const { data, error } = await db.from("claim_help_requests").select("*").order("created_at", { ascending: false }).limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = await Promise.all((data ?? []).map(async (row) => {
    const [policy, failure] = await Promise.all([
      db.storage.from("claim-help-documents").createSignedUrl(row.policy_document_path, 3600),
      db.storage.from("claim-help-documents").createSignedUrl(row.failure_document_path, 3600),
    ]);
    return { ...row, policyUrl: policy.data?.signedUrl ?? null, failureUrl: failure.data?.signedUrl ?? null };
  }));
  return NextResponse.json({ data: rows });
}

const updateSchema = z.object({ id: z.string().uuid(), status: z.enum(["new", "reviewing", "contacted", "resolved", "closed"]) });
export async function PATCH(request: NextRequest) {
  if (!(await allowed(request, "edit"))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const input = updateSchema.parse(await request.json());
    const { error } = await supabaseServer().from("claim_help_requests").update({ status: input.status, updated_at: new Date().toISOString() }).eq("id", input.id);
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof z.ZodError ? error.issues[0]?.message : "Unable to update request" }, { status: 400 });
  }
}
