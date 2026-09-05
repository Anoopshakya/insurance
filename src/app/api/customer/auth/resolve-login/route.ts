import { NextRequest, NextResponse } from "next/server";
import { normalizeCustomerMobile } from "@/lib/customers/schema";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const identifier = String((await request.json()).identifier || "").trim();
  if (identifier.includes("@")) return NextResponse.json({ email:identifier.toLowerCase() });
  const mobile = normalizeCustomerMobile(identifier);
  if (!/^\+\d{10,15}$/.test(mobile)) return NextResponse.json({ error:"Enter a valid email address or mobile number." }, { status:400 });
  const { data } = await supabaseServer().from("customers").select("email").eq("contact", mobile).maybeSingle();
  if (!data?.email) return NextResponse.json({ error:"No customer account was found with those details." }, { status:404 });
  return NextResponse.json({ email:data.email });
}
