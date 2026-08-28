import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRequestToken } from "@/lib/firebase-admin";
import { userHasPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";
import { slugify } from "@/lib/catalog-master";
const tables = {
  sectors: "categories",
  providers: "insurers",
  types: "product_types",
} as const;
type Kind = keyof typeof tables;
async function authorize(req: NextRequest, action: "view" | "edit") {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!(await userHasPermission(decoded.uid, "catalog", action)))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return null;
}
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
) {
  const denied = await authorize(req, "view");
  if (denied) return denied;
  const { kind } = await params;
  if (!(kind in tables))
    return NextResponse.json({ error: "Unknown master" }, { status: 404 });
  const db = supabaseServer();
  const query =
    kind === "types"
      ? db.from("product_types").select("*,categories(id,name)")
      : db.from(tables[kind as Kind]).select("*");
  const { data, error } = await query.order(
    kind === "providers" ? "name" : "sort_order",
    { ascending: true },
  );
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({ data });
}
const inputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().max(100).optional(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  icon: z.string().trim().max(20).optional().or(z.literal("")),
  active: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  categoryId: z.string().uuid().optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  apiStatus: z.enum(["not_integrated", "testing", "integrated"]).optional(),
});
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
) {
  const denied = await authorize(req, "edit");
  if (denied) return denied;
  const { kind } = await params;
  if (!(kind in tables))
    return NextResponse.json({ error: "Unknown master" }, { status: 404 });
  try {
    const raw = await req.json();
    const cleaned = Object.fromEntries(
      Object.entries(raw).filter(
        ([, value]) => value !== null && value !== undefined,
      ),
    );
    const input = inputSchema.parse(cleaned);
    if (kind === "types" && !input.categoryId)
      return NextResponse.json(
        { error: "Product sector is required" },
        { status: 400 },
      );
    const slug = input.slug ? slugify(input.slug) : slugify(input.name);
    const row =
      kind === "sectors"
        ? {
            name: input.name,
            slug,
            description: input.description || null,
            icon: input.icon || null,
            active: input.active ?? true,
            sort_order: input.sortOrder ?? 0,
          }
        : kind === "providers"
          ? {
              name: input.name,
              slug,
              description: input.description || null,
              logo_url: input.logoUrl || null,
              website_url: input.websiteUrl || null,
              api_status: input.apiStatus || "not_integrated",
              active: input.active ?? true,
            }
          : {
              category_id: input.categoryId,
              name: input.name,
              slug,
              description: input.description || null,
              active: input.active ?? true,
              sort_order: input.sortOrder ?? 0,
            };
    const { data, error } = await supabaseServer()
      .from(tables[kind as Kind])
      .insert(row as never)
      .select()
      .single();
    return error
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid master data" },
        { status: 400 },
      );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid master data" },
      { status: 400 },
    );
  }
}
