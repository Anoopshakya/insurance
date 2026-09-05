import { NextRequest, NextResponse } from "next/server";
import { normalizeMobile } from "@/lib/partners/schema";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const identifier = String((await request.json()).identifier || "").trim();
  if (identifier.includes("@"))
    return NextResponse.json({ email: identifier.toLowerCase() });
  const mobile = normalizeMobile(identifier);
  if (!/^\+91\d{10}$/.test(mobile))
    return NextResponse.json(
      { error: "Enter a valid email address or mobile number." },
      { status: 400 },
    );
  const { data } = await supabaseServer()
    .from("users")
    .select("email")
    .eq("phone", mobile)
    .in("portal", ["partner", "agent"])
    .maybeSingle();
  if (!data?.email)
    return NextResponse.json(
      { error: "No partner account was found with those details." },
      { status: 404 },
    );
  return NextResponse.json({ email: data.email });
}
