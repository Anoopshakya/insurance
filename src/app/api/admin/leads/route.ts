import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRequestToken } from "@/lib/auth-server";
import { ensureAdminPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";

async function authorize(request: NextRequest, action: string) {
  const user = await verifyRequestToken(request.headers.get("authorization"));
  if (!user) return null;
  return (await ensureAdminPermission(user.uid, user.email, "leads", action))
    ? user
    : null;
}

export async function GET(request: NextRequest) {
  const actor=await authorize(request,"view");
  if (!actor)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const db = supabaseServer();
  const [websiteResult, internalResult, agentsResult, sectorsResult, typesResult] = await Promise.all([
    db.from("website_quote_requests").select("*,followups:lead_followups(id,scheduled_at,status,followup_type)").eq("followups.status","scheduled").order("created_at", { ascending: false }).limit(1000),
    db.from("leads").select("*,followups:lead_followups(id,scheduled_at,status,followup_type)").eq("followups.status","scheduled").order("created_at", { ascending: false }).limit(1000),
    db.from("agents").select("id,user_id,agent_code,users:users!agents_user_id_fkey(full_name)").order("created_at", { ascending: false }),
    db.from("categories").select("id,name").eq("active",true).order("sort_order"),
    db.from("product_types").select("id,name,category_id").eq("active",true).order("sort_order"),
  ]);
  const error = websiteResult.error || internalResult.error || agentsResult.error || sectorsResult.error || typesResult.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const agents = agentsResult.data ?? [];
  const agentMap = new Map(agents.map((agent) => [agent.id, agent]));
  const website = (websiteResult.data ?? []).map((lead) => ({
    ...lead,
    leadType: "website" as const,
    name: lead.customer_name,
    contact: lead.mobile,
    source: "Website",
    agent: null,
  }));
  const internal = (internalResult.data ?? []).map((lead) => ({
    ...lead,
    leadType: "internal" as const,
    selections: null,
    agent: agentMap.get(lead.agent_id) ?? null,
  }));

  return NextResponse.json({
    data: [...website, ...internal].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    currentUserId:actor.uid,
    agents,
    sectors: sectorsResult.data || [],
    productTypes: typesResult.data || [],
  });
}

const createSchema = z.object({
  productSectorId: z.string().uuid("Select a product sector."),
  productTypeId: z.string().uuid("Select a product type."),
  purchaseTimeline: z.enum(["immediately","within_7_days","within_30_days","within_3_months","researching"]),
  customerId:z.union([z.string().uuid(),z.literal("")]).optional(),
  name: z.string().trim().min(2).max(100),
  contact: z.string().trim().regex(/^[0-9]{10}$/, "Enter exactly 10 digits for the mobile number"),
  agentId: z.string().uuid(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

async function saveLead(request: NextRequest, editing: boolean) {
  if (!(await authorize(request, editing ? "edit" : "create")))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const input = createSchema.extend({id: z.string().uuid().optional()}).parse(await request.json());
    if(editing&&!input.id)return NextResponse.json({error:"Select a lead to edit."},{status:400});
    const {data:selectedType,error:typeError}=await supabaseServer().from("product_types")
      .select("id,categories!inner(active)").eq("id",input.productTypeId)
      .eq("category_id",input.productSectorId).eq("active",true).eq("categories.active",true).maybeSingle();
    if(typeError||!selectedType)return NextResponse.json({error:"Select a valid product sector and product type."},{status:400});
    if(input.customerId){const {data,error}=await supabaseServer().from('customers').select('id,agent_id').eq('id',input.customerId).maybeSingle();if(error||!data)return NextResponse.json({error:'Customer not found.'},{status:404});if(data.agent_id&&data.agent_id!==input.agentId)return NextResponse.json({error:'Select the partner assigned to this customer.'},{status:400});}

    const values={
      agent_id:input.agentId,customer_id:input.customerId||null,name:input.name,
      contact:input.contact,priority:input.priority,product_sector_id:input.productSectorId,
      product_type_id:input.productTypeId,purchase_timeline:input.purchaseTimeline,
    };
    const table=supabaseServer().from("leads");
    const query=editing?table.update({...values,updated_at:new Date().toISOString()}).eq("id",input.id!):table.insert({...values,source:"admin_created"});
    const {data,error}=await query.select().maybeSingle();
    if(!error&&!data)return NextResponse.json({error:"Lead not found."},{status:404});
    return error
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ data }, { status: editing ? 200 : 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof z.ZodError ? error.issues[0]?.message : "Could not create lead" },
      { status: 400 },
    );
  }
}

export const POST=(request:NextRequest)=>saveLead(request,false);
export const PUT=(request:NextRequest)=>saveLead(request,true);

const updateSchema = z.object({
  id: z.string().uuid(),
  leadType: z.enum(["website", "internal"]),
  status: z.enum(["new","contacted","qualified","proposal","converted","lost"]),
  lostReason:z.string().max(100).optional(),lostNote:z.string().trim().max(4000).optional(),
});

export async function PATCH(request: NextRequest) {
  const actor=await authorize(request,"edit");
  if (!actor)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const input = updateSchema.parse(await request.json());
    const allowed = input.leadType === "website"
      ? new Set(["new","contacted","qualified","proposal","converted","lost"])
      : new Set(["new", "contacted", "qualified", "proposal", "converted", "lost"]);
    if (!allowed.has(input.status))
      return NextResponse.json({ error: "Invalid lead status" }, { status: 400 });
    const table = input.leadType === "website" ? "website_quote_requests" : "leads";
    const db = supabaseServer();
    const { data: lead, error: leadError } = await db
      .from(table)
      .select("*")
      .eq("id", input.id)
      .maybeSingle();
    if (leadError || !lead)
      return NextResponse.json({ error: leadError?.message || "Lead not found" }, { status: 404 });
    const {error}=await db.rpc('manage_lead_activity',{p_kind:input.leadType,p_id:input.id,p_actor:actor.uid,p_action:'status',p_data:input});
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (input.status !== "converted") return NextResponse.json({ ok: true });
    {
      const {data:policy,error:policyError}=await db.from('policies').select('id').eq(input.leadType==='internal'?'source_lead_id':'source_website_lead_id',lead.id).maybeSingle();
      if(policyError)return NextResponse.json({error:policyError.message},{status:400});
      if(policy)return NextResponse.json({ok:true,policyId:policy.id});
    }
    if (input.leadType === "website")
      return NextResponse.json({ ok: true, conversion: { leadId: lead.id, leadType: "website", name: lead.customer_name, contact: lead.mobile } });
    let { data: customer } = await db.from("customers").select("id").eq("created_from_lead_id", lead.id).maybeSingle();
    if (!customer && lead.contact) {
      const existing = await db.from("customers").select("id").eq("agent_id", lead.agent_id).eq("contact", lead.contact).maybeSingle();
      customer = existing.data;
    }
    if (!customer) {
      const created = await db.from("customers").insert({ agent_id: lead.agent_id, name: lead.name, contact: lead.contact, created_from_lead_id: lead.id }).select("id").single();
      if (created.error) return NextResponse.json({ error: created.error.message }, { status: 400 });
      customer = created.data;
    }
    return NextResponse.json({ ok: true, conversion: { leadId: lead.id, leadType: "internal", customerId: customer?.id, agentId: lead.agent_id, sectorId: lead.product_sector_id, productTypeId: lead.product_type_id, name: lead.name, contact: lead.contact } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof z.ZodError ? error.issues[0]?.message : "Could not update lead" },
      { status: 400 },
    );
  }
}
