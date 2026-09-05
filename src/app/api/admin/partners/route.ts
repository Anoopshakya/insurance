import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/firebase-admin";
import { ensureAdminPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";
import { createPartner } from "@/lib/partners/service";
import { partnerInputSchema } from "@/lib/partners/schema";

async function authorize(req: NextRequest, action: string) {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded) return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  if (!(await ensureAdminPermission(decoded.uid, decoded.email, "agents", action))) return { error: NextResponse.json({ error: "Your employee role does not include the required partner-management permission." }, { status: 403 }) };
  return { decoded };
}

export async function GET(req: NextRequest) {
  const auth = await authorize(req, "view"); if (auth.error) return auth.error;
  const db = supabaseServer();
  const { data, error } = await db.from("agents").select("id,name,agent_code,partner_type,region,status,kyc_status,joining_date,created_at,users:users!agents_user_id_fkey!inner(full_name,phone,email)").order("created_at", { ascending: false }).limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids=(data??[]).map(agent=>agent.id);
  const [{data:policies},{data:earnings}]=ids.length?await Promise.all([db.from("policies").select("agent_id,premium").in("agent_id",ids),db.from("earning_ledger").select("agent_id,amount").in("agent_id",ids)]):[{data:[]},{data:[]}];
  const performance=new Map<string,{policies:number,business:number,commission:number}>();
  ids.forEach(id=>performance.set(id,{policies:0,business:0,commission:0}));
  (policies??[]).forEach(row=>{const item=performance.get(row.agent_id);if(item){item.policies+=1;item.business+=Number(row.premium)||0}});
  (earnings??[]).forEach(row=>{const item=performance.get(row.agent_id);if(item)item.commission+=Number(row.amount)||0});
  const rows=(data??[]).map(agent=>({...agent,...performance.get(agent.id)}));
  const inactive=new Set(["suspended","rejected","deactivated"]);const now=new Date();
  const metrics={total:rows.length,active:rows.filter(row=>row.status==="active").length,inactive:rows.filter(row=>inactive.has(row.status)).length,pending:rows.filter(row=>row.status!=="active"&&!inactive.has(row.status)).length,newThisMonth:rows.filter(row=>{const date=new Date(row.created_at);return date.getMonth()===now.getMonth()&&date.getFullYear()===now.getFullYear()}).length,totalBusiness:rows.reduce((sum,row)=>sum+row.business,0),totalCommission:rows.reduce((sum,row)=>sum+row.commission,0)};
  return NextResponse.json({ data:rows,metrics });
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req, "create"); if (auth.error) return auth.error;
  try {
    const input = partnerInputSchema.parse(await req.json());
    return NextResponse.json({ data: await createPartner(input, auth.decoded!.uid) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "Partner creation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
