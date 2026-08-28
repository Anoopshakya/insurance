import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/firebase-admin";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded || decoded.role !== "partner") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const db = supabaseServer();
  const { data, error } = await db.from("agents").select("id,agent_code,status,kyc_status,joining_date,partner_type,region,users:users!agents_user_id_fkey!inner(full_name,phone)").eq("user_id", decoded.uid).single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ data });
}
