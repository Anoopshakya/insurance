import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const decoded = await verifyRequestToken(request.headers.get("authorization"));
  if (!decoded || decoded.role !== "customer") return NextResponse.json({ error:"forbidden" }, { status:403 });
  const { data,error } = await supabaseServer().from("customers").select("id,customer_code,name,contact,email,created_at").eq("user_id",decoded.uid).single();
  return error ? NextResponse.json({ error:"Customer profile could not be loaded." }, { status:404 }) : NextResponse.json({ data });
}
