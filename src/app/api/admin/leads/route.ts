import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRequestToken } from "@/lib/firebase-admin";
import { ensureAdminPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";

async function authorize(request: NextRequest, action: string) {
  const user = await verifyRequestToken(request.headers.get("authorization"));
  if (!user) return null;
  return (await ensureAdminPermission(user.uid, user.email, "leads", action))
    ? user
    : null;
}

export async function GET(request: NextRequest) {
  if (!(await authorize(request, "view")))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const db = supabaseServer();
  const [websiteResult, internalResult, agentsResult] = await Promise.all([
    db.from("website_quote_requests").select("*").order("created_at", { ascending: false }).limit(1000),
    db.from("leads").select("*").order("created_at", { ascending: false }).limit(1000),
    db.from("agents").select("id,agent_code,users:users!agents_user_id_fkey(full_name)").order("created_at", { ascending: false }),
  ]);
  const error = websiteResult.error || internalResult.error || agentsResult.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const agents = agentsResult.data ?? [];
  const agentMap = new Map(agents.map((agent) => [agent.id, agent]));
  const website = (websiteResult.data ?? []).map((lead) => ({
    ...lead,
    leadType: "website" as const,
    name: lead.customer_name,
    contact: lead.mobile,
    source: "Website",
    agent: null,
  }));
  const internal = (internalResult.data ?? []).map((lead) => ({
    ...lead,
    leadType: "internal" as const,
    selections: null,
    agent: agentMap.get(lead.agent_id) ?? null,
  }));

  return NextResponse.json({
    data: [...website, ...internal].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    agents,
  });
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  contact: z.string().trim().min(10).max(20),
  agentId: z.string().uuid(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export async function POST(request: NextRequest) {
  if (!(await authorize(request, "create")))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const input = createSchema.parse(await request.json());
    const { data, error } = await supabaseServer()
      .from("leads")
      .insert({
        agent_id: input.agentId,
        name: input.name,
        contact: input.contact,
        priority: input.priority,
        source: "admin_created",
      })
      .select()
      .single();
    return error
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof z.ZodError ? error.issues[0]?.message : "Could not create lead" },
      { status: 400 },
    );
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  leadType: z.enum(["website", "internal"]),
  status: z.string().min(2).max(30),
});

export async function PATCH(request: NextRequest) {
  if (!(await authorize(request, "edit")))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const input = updateSchema.parse(await request.json());
    const allowed = input.leadType === "website"
      ? new Set(["new", "contacted", "converted", "closed"])
      : new Set(["new", "contacted", "qualified", "proposal", "converted", "lost"]);
    if (!allowed.has(input.status))
      return NextResponse.json({ error: "Invalid lead status" }, { status: 400 });
    const table = input.leadType === "website" ? "website_quote_requests" : "leads";
    const { error } = await supabaseServer()
      .from(table)
      .update({ status: input.status, updated_at: new Date().toISOString() })
      .eq("id", input.id);
    return error
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof z.ZodError ? error.issues[0]?.message : "Could not update lead" },
      { status: 400 },
    );
  }
}
