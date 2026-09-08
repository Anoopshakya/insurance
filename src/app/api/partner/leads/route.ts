import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRequestToken } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase-server";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  contact: z.string().trim().min(10).max(20),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  productSectorId: z.string().uuid(),
  productTypeId: z.string().uuid(),
  purchaseTimeline: z.enum([
    "immediately",
    "within_7_days",
    "within_30_days",
    "within_3_months",
    "researching",
  ]),
});

async function partnerAgent(request: NextRequest) {
  const user = await verifyRequestToken(request.headers.get("authorization"));
  if (!user || user.role !== "partner") return null;
  const { data } = await supabaseServer()
    .from("agents")
    .select("id,status")
    .eq("user_id", user.uid)
    .single();
  return data;
}

export async function GET(request: NextRequest) {
  const agent = await partnerAgent(request);
  if (!agent) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const db = supabaseServer();
  const [{ data, error }, { data: sectors }, { data: productTypes }] =
    await Promise.all([
      db
        .from("leads")
        .select(
          "id,name,contact,source,priority,status,created_at,updated_at,product_sector_id,product_type_id,purchase_timeline,product_sector:categories!leads_product_sector_id_fkey(name),product_type:product_types!leads_product_type_id_fkey(name)",
        )
        .eq("agent_id", agent.id)
        .order("created_at", { ascending: false })
        .limit(500),
      db
        .from("categories")
        .select("id,name")
        .eq("active", true)
        .order("sort_order"),
      db
        .from("product_types")
        .select("id,category_id,name")
        .eq("active", true)
        .order("sort_order"),
    ]);
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({
        data,
        sectors: sectors || [],
        productTypes: productTypes || [],
      });
}

export async function POST(request: NextRequest) {
  const agent = await partnerAgent(request);
  if (!agent) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const db = supabaseServer();
    if (agent.status !== "active")
      return NextResponse.json(
        { error: "Only active partners can create leads" },
        { status: 403 },
      );
    const { data: selectedType } = await db
      .from("product_types")
      .select("id,category_id,active,categories!inner(active)")
      .eq("id", input.productTypeId)
      .eq("category_id", input.productSectorId)
      .eq("active", true)
      .eq("categories.active", true)
      .maybeSingle();
    if (!selectedType)
      return NextResponse.json(
        { error: "Select a valid product sector and product type." },
        { status: 400 },
      );
    const { data, error } = await db
      .from("leads")
      .insert({
        agent_id: agent.id,
        name: input.name,
        contact: input.contact,
        priority: input.priority,
        product_sector_id: input.productSectorId,
        product_type_id: input.productTypeId,
        purchase_timeline: input.purchaseTimeline,
        source: "partner_created",
      })
      .select()
      .single();
    return error
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? error.issues[0]?.message
            : "Could not create lead",
      },
      { status: 400 },
    );
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "new",
    "contacted",
    "qualified",
    "proposal",
    "converted",
    "lost",
  ]),
});

export async function PATCH(request: NextRequest) {
  const agent = await partnerAgent(request);
  if (!agent) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const input = updateSchema.parse(await request.json());
    const { error } = await supabaseServer()
      .from("leads")
      .update({ status: input.status, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .eq("agent_id", agent.id);
    return error
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? error.issues[0]?.message
            : "Could not update lead",
      },
      { status: 400 },
    );
  }
}
