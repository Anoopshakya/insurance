import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase-server";
import { dashboardRows, summarizeDashboard, hasPartnerActivity, type DashboardPolicy, type DashboardEarning, type DashboardAdjustment } from "@/lib/partners/dashboard";
export async function GET(request:NextRequest) {
  try {
    const user=await verifyRequestToken(request.headers.get("authorization"));
    if(!user||user.role!=="partner")return NextResponse.json({error:"Forbidden"},{status:403});
    const db=supabaseServer();
    const agent=await db.from("agents").select("id").eq("user_id",user.uid).maybeSingle();
    if(agent.error)throw new Error("Partner lookup failed");
    if(!agent.data)return NextResponse.json({error:"Partner account not found"},{status:403});
    const id=agent.data.id;
    const [leadCount,customerCount,quoteCount,recent,policies,earnings,adjustments,clawbacks]=await Promise.all([
      db.from("leads").select("id",{count:"exact",head:true}).eq("agent_id",id),
      db.from("customers").select("id",{count:"exact",head:true}).eq("agent_id",id),
      db.from("quotes").select("id",{count:"exact",head:true}).eq("agent_id",id),
      db.from("leads").select("id,name,contact,status,created_at,product_type:product_types!leads_product_type_id_fkey(name)").eq("agent_id",id).order("created_at",{ascending:false}).order("id").limit(5),
      dashboardRows((from,to)=>db.from("policies").select("id,status,created_at,expiry_date,premium,category:categories!category_id(name)").eq("agent_id",id).order("id").range(from,to)),
      dashboardRows((from,to)=>db.from("earning_ledger").select("id,amount,status,created_at,generation_level").eq("agent_id",id).order("id").range(from,to)),
      dashboardRows((from,to)=>db.from("earning_adjustments").select("id,earning_id,amount_delta,earning:earning_ledger!inner(agent_id)").eq("earning.agent_id",id).order("id").range(from,to)),
      dashboardRows((from,to)=>db.from("clawbacks").select("id,earning_id,amount,earning:earning_ledger!inner(agent_id)").eq("earning.agent_id",id).order("id").range(from,to)),
    ]);
    if(leadCount.error||customerCount.error||quoteCount.error||recent.error||leadCount.count===null||customerCount.count===null||quoteCount.count===null)throw new Error("Dashboard lookup failed");
    return NextResponse.json({data:{hasActivity:hasPartnerActivity({leads:leadCount.count,customers:customerCount.count,quotes:quoteCount.count,policies:policies.length,earnings:earnings.length}),...summarizeDashboard(policies as DashboardPolicy[],earnings as DashboardEarning[],adjustments as DashboardAdjustment[],clawbacks as DashboardAdjustment[]),leads:leadCount.count,customers:customerCount.count,updatedAt:new Date().toISOString(),recentLeads:(recent.data||[]).map(row=>({...row,product:(Array.isArray(row.product_type)?row.product_type[0]:row.product_type)?.name||"Not specified"}))}},{headers:{"Cache-Control":"private, no-store"}});
  } catch { return NextResponse.json({error:"Unable to load your dashboard. Please try again."},{status:500}); }
}
