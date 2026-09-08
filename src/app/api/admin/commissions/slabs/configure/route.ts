import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRequestToken } from "@/lib/auth-server";
import { ensureAdminPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";

async function allowed(request: NextRequest, action: string) {
  const user = await verifyRequestToken(request.headers.get("authorization"));
  return user && await ensureAdminPermission(user.uid, user.email, "commission_rules", action);
}

const rangeSchema = z.object({
  max: z.number().positive().nullable(),
  high: z.number().min(0).max(100),
  average: z.number().min(0).max(100),
  low: z.number().min(0).max(100),
});

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(100),
  businessType: z.enum(["fresh", "port", "renew"]),
  commissionCategoryId: z.string().uuid(),
  ranges: z.array(rangeSchema).min(1).max(10),
  active: z.boolean().optional(),
}).superRefine((value, context) => {
  const maximums = value.ranges.map((range) => range.max).filter((maximum): maximum is number => maximum !== null);
  if (maximums.some((maximum, index) => index > 0 && maximum <= maximums[index - 1])) {
    context.addIssue({ code: "custom", message: "Slab upper limits must increase from left to right" });
  }
});

export async function GET(request: NextRequest) {
  if (!await allowed(request, "view")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  const db = supabaseServer();
  const [{ data: commissionCategories, error: categoryError }, { data: record, error: recordError }] = await Promise.all([
    db.from("company_commission_categories").select("id,name,category_id,product_type_id,sector:categories!category_id(id,name),type:product_types!product_type_id(id,name)").eq("active", true).order("name"),
    id ? db.from("partner_commission_slabs").select("*").eq("id", id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  const error = categoryError || recordError;
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ commissionCategories: commissionCategories || [], record });
}

export async function POST(request: NextRequest) {
  if (!await allowed(request, "propose")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const db = supabaseServer();
    const { data: category, error: categoryError } = await db.from("company_commission_categories").select("id,category_id").eq("id", input.commissionCategoryId).eq("active", true).single();
    if (categoryError || !category) return NextResponse.json({ error: categoryError?.message || "Commission category not found" }, { status: 400 });
    const row = {
      name: input.name,
      business_type: input.businessType,
      category_id: category.category_id,
      commission_category_id: category.id,
      slab_ranges: input.ranges,
      high_categories: input.ranges.length,
      average_categories: input.ranges.length,
      low_categories: input.ranges.length,
      active: input.active ?? true,
      updated_at: new Date().toISOString(),
    };
    const result = input.id
      ? await db.from("partner_commission_slabs").update(row).eq("id", input.id).select().single()
      : await db.from("partner_commission_slabs").insert(row).select().single();
    return result.error ? NextResponse.json({ error: result.error.message }, { status: 400 }) : NextResponse.json({ data: result.data }, { status: input.id ? 200 : 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof z.ZodError ? error.issues[0]?.message : "Could not save commission slab" }, { status: 400 });
  }
}
