import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase-server";
export async function GET(request: NextRequest) {
  try {
    const user = await verifyRequestToken(request.headers.get("authorization"));
    if (!user || user.role !== "partner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const db = supabaseServer();
    const { data: agent, error: agentError } = await db.from("agents").select("id").eq("user_id", user.uid).single();
    if (agentError || !agent) return NextResponse.json({ error: "Unable to load partner account." }, { status: 403 });
    const leads = [];
    for (let from = 0; ; from += 500) {
      const { data, error } = await db.from("leads").select("id,name,contact,status,priority,source,created_at,updated_at,product_sector:categories!leads_product_sector_id_fkey(name),product_type:product_types!leads_product_type_id_fkey(name)")
        .eq("agent_id", agent.id).eq("status", "converted").order("updated_at", { ascending: false }).order("id").range(from, from + 499);
      if (error || !data) throw Error("Lead query failed");
      leads.push(...data);
      if (data.length < 500) break;
    }
    return NextResponse.json({ data: leads }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Unable to load converted leads. Please try again." }, { status: 500 }); }
}
