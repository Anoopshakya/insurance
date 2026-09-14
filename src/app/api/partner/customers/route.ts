import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createIdentityCode } from "@/lib/identity-code";
import { verifyRequestToken } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase-server";

async function agentId(request: NextRequest) {
  const user = await verifyRequestToken(request.headers.get("authorization"));
  if (!user || user.role !== "partner") return null;
  const { data } = await supabaseServer()
    .from("agents")
    .select("id")
    .eq("user_id", user.uid)
    .single();
  return data?.id || null;
}
export async function GET(request: NextRequest) {
  const agent = await agentId(request);
  if (!agent) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const db = supabaseServer(),
    { data, error } = await db
      .from("customers")
      .select(
        "id,user_id,name,contact,email,address,created_at,updated_at,users:users!customers_user_id_fkey(full_name,email,phone,status)",
      )
      .eq("agent_id", agent)
      .order("created_at", { ascending: false })
      .limit(1000);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = (data || []).map((row) => row.id),
    { data: policies } = ids.length
      ? await db
          .from("policies")
          .select("customer_id,premium,status")
          .in("customer_id", ids)
      : { data: [] };
  const stats = new Map(
    ids.map((id) => [id, { policies: 0, activePolicies: 0, premium: 0 }]),
  );
  (policies || []).forEach((policy) => {
    const item = stats.get(policy.customer_id);
    if (item) {
      item.policies++;
      if (policy.status === "active") item.activePolicies++;
      item.premium += Number(policy.premium) || 0;
    }
  });
  const rows = (data || []).map((row) => ({
      ...row,
      ...stats.get(row.id),
      accountStatus: (row.users as any)?.status || "crm",
    })),
    now = new Date();
  return NextResponse.json({
    data: rows,
    metrics: {
      total: rows.length,
      registered: rows.filter((row) => row.user_id).length,
      active: rows.filter((row) => row.accountStatus === "active").length,
      newThisMonth: rows.filter((row) => {
        const date = new Date(row.created_at);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }).length,
      totalPolicies: rows.reduce((sum, row) => sum + row.policies, 0),
      totalPremium: rows.reduce((sum, row) => sum + row.premium, 0),
    },
  });
}
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  contact: z.string().trim().regex(/^[0-9]{10}$/, "Enter exactly 10 digits for the mobile number"),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
});
export async function POST(request: NextRequest) {
  const agent = await agentId(request);
  if (!agent) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const input = schema.parse(await request.json()),
      db = supabaseServer(),
      { data, error } = await db
        .from("customers")
        .insert({
          agent_id: agent,
          customer_code: createIdentityCode("customer", input.name),
          name: input.name,
          contact: input.contact,
          email: input.email || null,
          address: input.address || null,
        })
        .select()
        .single();
    return error
      ? NextResponse.json(
          {
            error:
              error.code === "23505"
                ? "This email or mobile number is already registered."
                : error.message,
          },
          { status: 400 },
        )
      : NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? error.issues[0]?.message
            : "Could not create customer",
      },
      { status: 400 },
    );
  }
}
