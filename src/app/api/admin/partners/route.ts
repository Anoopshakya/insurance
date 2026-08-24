import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/firebase-admin";
import { userHasPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";
import { createPartner } from "@/lib/partners/service";
import { partnerInputSchema } from "@/lib/partners/schema";

async function authorize(req: NextRequest, action: string) {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded) return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  if (!(await userHasPermission(decoded.uid, "agents", action))) return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { decoded };
}

export async function GET(req: NextRequest) {
  const auth = await authorize(req, "view"); if (auth.error) return auth.error;
  const db = supabaseServer();
  const { data, error } = await db.from("agents").select("id,agent_code,partner_type,region,status,kyc_status,created_at,users!inner(full_name,phone,email)").order("created_at", { ascending: false }).limit(100);
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req, "create"); if (auth.error) return auth.error;
  try {
    const input = partnerInputSchema.parse(await req.json());
    return NextResponse.json({ data: await createPartner(input, auth.decoded!.uid) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Partner creation failed" }, { status: 400 });
  }
}
