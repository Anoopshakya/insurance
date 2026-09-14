import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth-server";
import { ensureAdminPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRequestToken(request.headers.get("authorization"));
    if (!user || !(await ensureAdminPermission(user.uid, user.email, "leads", "view"))) {
      return NextResponse.json({ error: "You do not have permission to view contact requests." }, { status: 403 });
    }
    const db = supabaseServer();
    const rows = [];
    // Read stable pages so existing submissions beyond Supabase's row limit remain visible.
    for (let from = 0; ; from += 500) {
      const { data, error } = await db.from("website_contact_requests")
        .select("id,name,mobile,email,state,message,consent,status,created_at")
        .order("created_at", { ascending: false }).order("id")
        .range(from, from + 499);
      if (error || !data) throw Error("Contact requests unavailable");
      rows.push(...data);
      if (data.length < 500) break;
    }
    return NextResponse.json({ data: rows }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load contact requests. Please try again." }, { status: 500 });
  }
}
