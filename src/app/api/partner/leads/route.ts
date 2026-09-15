import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRequestToken } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase-server";

const schema = z.object({
  customerId:z.string().uuid().optional(),
  name: z.string().trim().min(2).max(100),
  contact: z.string().trim().regex(/^[0-9]{10}$/, "Enter exactly 10 digits for the mobile number"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  productSectorId: z.string().uuid(),
  productTypeId: z.string().uuid(),
  purchaseTimeline: z.enum([
    "immediately",
    "within_7_days",
    "within_30_days",
    "within_3_months",
    "researching",
  ]),
});

async function partnerAgent(request: NextRequest) {
  const user = await verifyRequestToken(request.headers.get("authorization"));
  if (!user || user.role !== "partner") return null;
  const { data } = await supabaseServer()
    .from("agents")
    .select("id,status")
    .eq("user_id", user.uid)
    .single();
  return data;
}

export async function GET(request: NextRequest) {
  const agent = await partnerAgent(request);
  if (!agent) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const db = supabaseServer();
  const [{ data, error }, { data: sectors }, { data: productTypes }] =
    await Promise.all([
      db
        .from("leads")
        .select(
          "id,customer_id,policy:policies!policies_source_lead_id_fkey(id),name,contact,source,priority,status,created_at,updated_at,product_sector_id,product_type_id,purchase_timeline,product_sector:categories!leads_product_sector_id_fkey(name),product_type:product_types!leads_product_type_id_fkey(name)",
        )
        .eq("agent_id", agent.id)
        .order("created_at", { ascending: false })
        .limit(500),
      db
        .from("categories")
        .select("id,name")
        .eq("active", true)
        .order("sort_order"),
      db
        .from("product_types")
        .select("id,category_id,name")
        .eq("active", true)
        .order("sort_order"),
    ]);
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({
        data,
        sectors: sectors || [],
        productTypes: productTypes || [],
      });
}

export async function POST(request: NextRequest) {
  const agent = await partnerAgent(request);
  if (!agent) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const db = supabaseServer();
    if (agent.status !== "active")
      return NextResponse.json(
        { error: "Only active partners can create leads" },
        { status: 403 },
      );
    const { data: selectedType } = await db
      .from("product_types")
      .select("id,category_id,active,categories!inner(active)")
      .eq("id", input.productTypeId)
      .eq("category_id", input.productSectorId)
      .eq("active", true)
      .eq("categories.active", true)
      .maybeSingle();
    if (!selectedType)
      return NextResponse.json(
        { error: "Select a valid product sector and product type." },
        { status: 400 },
      );
    if(input.customerId){const {data:customer}=await db.from("customers").select("id").eq("id",input.customerId).eq("agent_id",agent.id).maybeSingle();if(!customer)return NextResponse.json({error:"Customer not found"},{status:404});}
    const { data, error } = await db
      .from("leads")
      .insert({
        agent_id: agent.id,
        customer_id:input.customerId||null,
        name: input.name,
        contact: input.contact,
        priority: input.priority,
        product_sector_id: input.productSectorId,
        product_type_id: input.productTypeId,
        purchase_timeline: input.purchaseTimeline,
        source: "partner_created",
      })
      .select()
      .single();
    return error
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? error.issues[0]?.message
            : "Could not create lead",
      },
      { status: 400 },
    );
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "new",
    "contacted",
    "qualified",
    "proposal",
    "converted",
    "lost",
  ]),
});

export async function PATCH(request: NextRequest) {
  const agent = await partnerAgent(request);
  if (!agent) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const input = updateSchema.parse(await request.json());
    if(input.status==="converted"){
      const {data:policy}=await supabaseServer().from("policies").select("id").eq("source_lead_id",input.id).eq("agent_id",agent.id).maybeSingle();
      if(!policy)return NextResponse.json({error:"Complete Add New Policy to convert this lead"},{status:400});
    }
    const { data,error } = await supabaseServer()
      .from("leads")
      .update({ status: input.status, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .eq("agent_id", agent.id).select("id").maybeSingle();
    return error
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : data?NextResponse.json({ ok: true }):NextResponse.json({error:"Lead not found"},{status:404});
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? error.issues[0]?.message
            : "Could not update lead",
      },
      { status: 400 },
    );
  }
}

export async function PUT(request:NextRequest){
 const agent=await partnerAgent(request);if(!agent||!["active","approved"].includes(agent.status))return NextResponse.json({error:"Forbidden"},{status:403});
 try{const input=schema.extend({id:z.string().uuid()}).parse(await request.json()),db=supabaseServer();
 const {data:type}=await db.from("product_types").select("id,categories!inner(active)").eq("id",input.productTypeId).eq("category_id",input.productSectorId).eq("active",true).eq("categories.active",true).maybeSingle();
 if(!type)return NextResponse.json({error:"Select a valid product type"},{status:400});
 const {data,error}=await db.from("leads").update({name:input.name,contact:input.contact,priority:input.priority,product_sector_id:input.productSectorId,product_type_id:input.productTypeId,purchase_timeline:input.purchaseTimeline,updated_at:new Date().toISOString()}).eq("id",input.id).eq("agent_id",agent.id).select("id").maybeSingle();
 return error?NextResponse.json({error:error.message},{status:400}):data?NextResponse.json({data}):NextResponse.json({error:"Lead not found"},{status:404});
 }catch(e){return NextResponse.json({error:e instanceof z.ZodError?e.issues[0]?.message:"Unable to update lead"},{status:400})}
}
export async function DELETE(request:NextRequest){
 const agent=await partnerAgent(request);if(!agent||!["active","approved"].includes(agent.status))return NextResponse.json({error:"Forbidden"},{status:403});
 try{const {id}=z.object({id:z.string().uuid()}).parse(await request.json());const {data,error}=await supabaseServer().from("leads").delete().eq("id",id).eq("agent_id",agent.id).select("id").maybeSingle();
 return error?NextResponse.json({error:error.code==="23503"?"This lead is linked to a policy or customer and cannot be deleted.":error.message},{status:400}):data?NextResponse.json({ok:true}):NextResponse.json({error:"Lead not found"},{status:404});
 }catch{return NextResponse.json({error:"Unable to delete lead"},{status:400})}
}
