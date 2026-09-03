import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRequestToken } from "@/lib/firebase-admin";
import { supabaseServer } from "@/lib/supabase-server";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  contact: z.string().trim().min(10).max(20),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export async function POST(request: NextRequest) {
  const user = await verifyRequestToken(request.headers.get("authorization"));
  if (!user || user.role !== "partner")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const db = supabaseServer();
    const { data: agent, error: agentError } = await db
      .from("agents")
      .select("id,status")
      .eq("user_id", user.uid)
      .single();
    if (agentError || !agent)
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    if (agent.status !== "active")
      return NextResponse.json({ error: "Only active partners can create leads" }, { status: 403 });
    const { data, error } = await db
      .from("leads")
      .insert({
        agent_id: agent.id,
        name: input.name,
        contact: input.contact,
        priority: input.priority,
        source: "partner_created",
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
