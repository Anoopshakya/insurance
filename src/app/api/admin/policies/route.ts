import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRequestToken } from "@/lib/firebase-admin";
import { ensureAdminPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";

async function authorize(request: NextRequest, action: string) {
  const user = await verifyRequestToken(request.headers.get("authorization"));
  return user && await ensureAdminPermission(user.uid, user.email, "quotes_policies", action);
}

export async function GET(request: NextRequest) {
  if (!await authorize(request, "view")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const db = supabaseServer();
  const [policyResult, customerResult, agentResult, sectorResult, productResult, typeResult, insurerResult, planResult] = await Promise.all([
    db.from("policies").select("id,policy_number,customer_id,agent_id,category_id,product_id,product_type_id,insurer_id,plan_id,premium,coverage,start_date,expiry_date,tenure_months,business_type,status,created_at,updated_at,customer:customers!customer_id(id,name,contact,email),agent:agents!agent_id(id,agent_code,users:users!agents_user_id_fkey(full_name)),sector:categories!category_id(id,name),product:products!product_id(id,name,category:categories!category_id(id,name)),productType:product_types!product_type_id(id,name,category_id),insurer:insurers!insurer_id(id,name),plan:plans!plan_id(id,name)").order("created_at", { ascending: false }).limit(2000),
    db.from("customers").select("id,name,contact,email").order("name"),
    db.from("agents").select("id,agent_code,users:users!agents_user_id_fkey(full_name)").in("status", ["approved", "active"]).order("agent_code"),
    db.from("categories").select("id,name").eq("active", true).order("sort_order").order("name"),
    db.from("products").select("id,name,category_id,category:categories!category_id(id,name)").order("name"),
    db.from("product_types").select("id,name,category_id").eq("active", true).order("sort_order").order("name"),
    db.from("insurers").select("id,name").eq("active", true).order("name"),
    db.from("plans").select("id,name,product_id,insurer_id").order("name"),
  ]);
  const error = policyResult.error || customerResult.error || agentResult.error || sectorResult.error || productResult.error || typeResult.error || insurerResult.error || planResult.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const policies = policyResult.data || [], ids = policies.map((policy) => policy.id);
  const { data: earnings, error: earningError } = ids.length
    ? await db.from("earning_ledger").select("policy_id,amount,generation_level").in("policy_id", ids)
    : { data: [], error: null };
  if (earningError) return NextResponse.json({ error: earningError.message }, { status: 500 });
  const commissions = new Map<string, number>();
  (earnings || []).forEach((row) => commissions.set(row.policy_id, (commissions.get(row.policy_id) || 0) + Number(row.amount || 0)));
  const now = new Date(), soon = new Date(); soon.setDate(soon.getDate() + 30);
  const rows = policies.map((policy) => ({ ...policy, commission: commissions.get(policy.id) || 0 }));
  const isExpiring = (policy: any) => ["active", "issued"].includes(policy.status) && new Date(`${policy.expiry_date}T23:59:59`) >= now && new Date(`${policy.expiry_date}T23:59:59`) <= soon;
  const isLapsed = (policy: any) => policy.status === "expired" || (["active", "issued"].includes(policy.status) && new Date(`${policy.expiry_date}T23:59:59`) < now);
  return NextResponse.json({
    data: rows,
    metrics: {
      total: rows.length,
      active: rows.filter((row) => row.status === "active").length,
      expiring: rows.filter(isExpiring).length,
      lapsed: rows.filter(isLapsed).length,
      cancelled: rows.filter((row) => row.status === "cancelled").length,
      premium: rows.reduce((sum, row) => sum + Number(row.premium || 0), 0),
      commission: rows.reduce((sum, row) => sum + row.commission, 0),
    },
    options: { customers: customerResult.data || [], agents: agentResult.data || [], sectors: sectorResult.data || [], products: productResult.data || [], productTypes: typeResult.data || [], insurers: insurerResult.data || [], plans: planResult.data || [] },
  });
}

const createSchema = z.object({
  policyNumber: z.string().trim().min(3).max(80), customerId: z.string().uuid(), agentId: z.string().uuid(), sectorId: z.string().uuid(), productId: z.string().uuid().optional().or(z.literal("")), productTypeId: z.string().uuid(), insurerId: z.string().uuid(), planId: z.string().uuid().optional().or(z.literal("")),
  premium: z.coerce.number().positive(), coverage: z.coerce.number().nonnegative().optional(), startDate: z.string().date(), tenureMonths: z.coerce.number().int().min(1).max(360), businessType: z.enum(["fresh", "port", "renew"]), status: z.enum(["proposal", "pending", "issued", "active", "expired", "cancelled"]),
});

export async function POST(request: NextRequest) {
  if (!await authorize(request, "create")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const input = createSchema.parse(await request.json()), db = supabaseServer();
    const { data: productType } = await db.from("product_types").select("id,category_id").eq("id", input.productTypeId).eq("active", true).maybeSingle();
    if (!productType || productType.category_id !== input.sectorId) return NextResponse.json({ error: "The selected product type does not belong to the product sector." }, { status: 400 });
    if (input.productId) {
      const { data: product } = await db.from("products").select("id,category_id").eq("id", input.productId).maybeSingle();
      if (!product || product.category_id !== input.sectorId) return NextResponse.json({ error: "The selected product does not belong to the product sector." }, { status: 400 });
    }
    if (input.planId) {
      if (!input.productId) return NextResponse.json({ error: "Select a product before selecting a plan." }, { status: 400 });
      const { data: plan } = await db.from("plans").select("id").eq("id", input.planId).eq("product_id", input.productId).eq("insurer_id", input.insurerId).maybeSingle();
      if (!plan) return NextResponse.json({ error: "The selected plan does not belong to this product and insurer." }, { status: 400 });
    }
    const expiry = new Date(`${input.startDate}T00:00:00Z`); expiry.setUTCMonth(expiry.getUTCMonth() + input.tenureMonths); expiry.setUTCDate(expiry.getUTCDate() - 1);
    const { data, error } = await db.from("policies").insert({ policy_number: input.policyNumber, customer_id: input.customerId, agent_id: input.agentId, category_id: input.sectorId, product_id: input.productId || null, product_type_id: input.productTypeId, insurer_id: input.insurerId, plan_id: input.planId || null, premium: input.premium, coverage: input.coverage || null, start_date: input.startDate, expiry_date: expiry.toISOString().slice(0,10), tenure_months: input.tenureMonths, business_type: input.businessType, status: input.status }).select().single();
    return error ? NextResponse.json({ error: error.code === "23505" ? "This policy number already exists." : error.message }, { status: 400 }) : NextResponse.json({ data }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof z.ZodError ? error.issues[0]?.message : "Could not create policy" }, { status: 400 }); }
}

const updateSchema = z.object({ id: z.string().uuid(), status: z.enum(["proposal", "pending", "issued", "active", "expired", "cancelled"]) });
export async function PATCH(request: NextRequest) {
  if (!await authorize(request, "edit")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const input = updateSchema.parse(await request.json()), db = supabaseServer();
    const { data: current, error: readError } = await db.from("policies").select("status").eq("id", input.id).single();
    if (readError) return NextResponse.json({ error: readError.message }, { status: 404 });
    const { error } = await db.from("policies").update({ status: input.status, updated_at: new Date().toISOString() }).eq("id", input.id);
    if (!error) await db.from("policy_status_history").insert({ policy_id: input.id, from_status: current.status, to_status: input.status });
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof z.ZodError ? error.issues[0]?.message : "Could not update policy" }, { status: 400 }); }
}
