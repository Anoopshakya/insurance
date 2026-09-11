import { NextRequest, NextResponse } from "next/server";
import { contactRequestSchema } from "@/lib/contact-request";
import { supabaseServer } from "@/lib/supabase-server";
export async function POST(request: NextRequest) {
 let body: unknown;
 try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
 const parsed = contactRequestSchema.safeParse(body);
 if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
 try {
  const { website, ...input } = parsed.data;
  const { data, error } = await supabaseServer().from("website_contact_requests").insert(input).select("id").single();
  if (error || !data) throw new Error("Contact insert failed");
  return NextResponse.json({ data: { id: data.id } }, { status: 201 });
 } catch { return NextResponse.json({ error: "We could not send your message. Please try again or call +91 8920028861." }, { status: 503 }); }
}
