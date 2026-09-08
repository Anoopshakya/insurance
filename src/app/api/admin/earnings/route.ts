import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth-server";
import { ensureAdminPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";

const num=(value:unknown)=>Number(value)||0;
async function allowed(request:NextRequest,action:string){const user=await verifyRequestToken(request.headers.get("authorization"));return user&&await ensureAdminPermission(user.uid,user.email,"earnings",action)}

export async function GET(request:NextRequest){
  if(!await allowed(request,"view"))return NextResponse.json({error:"forbidden"},{status:403});
  const db=supabaseServer();
  const {data,error}=await db.from("earning_ledger").select("id,policy_id,agent_id,generation_level,amount,base_amount,rate_percent,gst_percent,status,created_at,partner_commission_slab_id,policy:policies!policy_id(policy_number,premium,start_date,business_type,customer:customers!customer_id(name),product:products!product_id(name),insurer:insurers!insurer_id(name)),agent:agents!agent_id(agent_code,users:users!agents_user_id_fkey(full_name)),slab:partner_commission_slabs!partner_commission_slab_id(name)").order("created_at",{ascending:false}).limit(3000);
  if(error)return NextResponse.json({error:error.message},{status:500});
  const rows=data||[],ids=rows.map(row=>row.id);
  const [{data:adjustments},{data:clawbacks}]=ids.length?await Promise.all([db.from("earning_adjustments").select("earning_id,amount_delta").in("earning_id",ids),db.from("clawbacks").select("earning_id,amount").in("earning_id",ids)]):[{data:[]},{data:[]}];
  const adj=new Map<string,number>(),claw=new Map<string,number>();(adjustments||[]).forEach(x=>adj.set(x.earning_id,(adj.get(x.earning_id)||0)+num(x.amount_delta)));(clawbacks||[]).forEach(x=>claw.set(x.earning_id,(claw.get(x.earning_id)||0)+num(x.amount)));
  const enriched=rows.map(row=>({...row,net_amount:num(row.amount)+(adj.get(row.id)||0)-(claw.get(row.id)||0)}));
  return NextResponse.json({data:enriched,metrics:{entries:enriched.length,grossPremium:enriched.filter(x=>x.generation_level===0).reduce((s,x)=>s+num((x.policy as any)?.premium),0),gstAdjustedBase:enriched.filter(x=>x.generation_level===0).reduce((s,x)=>s+num(x.base_amount),0),direct:enriched.filter(x=>x.generation_level===0).reduce((s,x)=>s+x.net_amount,0),network:enriched.filter(x=>x.generation_level>0).reduce((s,x)=>s+x.net_amount,0),payable:enriched.filter(x=>["eligible","payable"].includes(x.status)).reduce((s,x)=>s+x.net_amount,0),paid:enriched.filter(x=>x.status==="paid").reduce((s,x)=>s+x.net_amount,0)}});
}

export async function POST(request:NextRequest){
  if(!await allowed(request,"create"))return NextResponse.json({error:"forbidden"},{status:403});
  const db=supabaseServer();
  const [{data:policies,error},{data:slabs},{data:categories},{data:mappings},{data:closure},{data:rules}]=await Promise.all([
    db.from("policies").select("id,agent_id,category_id,product_id,product_type_id,insurer_id,premium,start_date,business_type,status,product:products!product_id(category_id)").in("status",["issued","active"]),
    db.from("partner_commission_slabs").select("id,business_type,category_id,commission_category_id,slab_ranges").eq("active",true),
    db.from("company_commission_categories").select("id,category_id,product_type_id").eq("active",true),
    db.from("commission_category_company_mappings").select("commission_category_id,insurer_id,commission_tier"),
    db.from("network_closure").select("ancestor_id,descendant_id,depth").gt("depth",0).lte("depth",3),
    db.from("commission_rules").select("id,product_id,insurer_id,business_type,generation_level,calculation_type,value,effective_from,effective_to").eq("status","active").gt("generation_level",0),
  ]);
  if(error)return NextResponse.json({error:error.message},{status:500});
  const monthly=new Map<string,number>();(policies||[]).forEach((p:any)=>{const key=`${p.agent_id}:${p.start_date.slice(0,7)}`;monthly.set(key,(monthly.get(key)||0)+num(p.premium)/1.18)});
  const writes:any[]=[];let skipped=0;
  for(const policy of policies||[]){
    const sectorId=policy.category_id||(policy.product as any)?.category_id,base=num(policy.premium)/1.18,monthVolume=monthly.get(`${policy.agent_id}:${policy.start_date.slice(0,7)}`)||0;
    const category=(categories||[]).find((x:any)=>x.category_id===sectorId&&x.product_type_id===policy.product_type_id),mapping=(mappings||[]).find((x:any)=>x.commission_category_id===category?.id&&x.insurer_id===policy.insurer_id),slab=(slabs||[]).find((x:any)=>x.commission_category_id===category?.id&&x.business_type===(policy.business_type||"fresh"));
    const range=(slab?.slab_ranges as any[]|undefined)?.find(item=>item.max===null||monthVolume<=num(item.max)),tier=mapping?.commission_tier as "high"|"average"|"low"|undefined,rate=tier?num(range?.[tier]):0;
    if(slab&&rate>=0)writes.push({policy_id:policy.id,agent_id:policy.agent_id,generation_level:0,commission_rule_id:null,partner_commission_slab_id:slab.id,base_amount:base,rate_percent:rate,gst_percent:18,amount:base*rate/100,status:"eligible"});else skipped++;
    for(const link of (closure||[]).filter((x:any)=>x.descendant_id===policy.agent_id)){
      const rule=(rules||[]).find((x:any)=>x.generation_level===link.depth&&(!x.product_id||x.product_id===policy.product_id)&&(!x.insurer_id||x.insurer_id===policy.insurer_id)&&(!x.business_type||x.business_type===(policy.business_type||"fresh"))&&x.effective_from<=policy.start_date&&(!x.effective_to||x.effective_to>=policy.start_date));
      if(!rule)continue;const value=rule.value as any,networkRate=num(value?.percentage??value?.rate??value?.percent),amount=rule.calculation_type==="flat"?num(value?.amount??value?.value):base*networkRate/100;
      writes.push({policy_id:policy.id,agent_id:link.ancestor_id,generation_level:link.depth,commission_rule_id:rule.id,partner_commission_slab_id:null,base_amount:base,rate_percent:rule.calculation_type==="flat"?null:networkRate,gst_percent:18,amount,status:"eligible"});
    }
  }
  if(writes.length){const{error:writeError}=await db.from("earning_ledger").upsert(writes,{onConflict:"policy_id,agent_id,generation_level"});if(writeError)return NextResponse.json({error:writeError.message},{status:400})}
  return NextResponse.json({ok:true,calculated:writes.length,skipped});
}
