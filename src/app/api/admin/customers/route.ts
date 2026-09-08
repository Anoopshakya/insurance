import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth-server";
import { ensureAdminPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request:NextRequest) {
  const decoded=await verifyRequestToken(request.headers.get("authorization"));
  if(!decoded)return NextResponse.json({error:"unauthenticated"},{status:401});
  if(!(await ensureAdminPermission(decoded.uid,decoded.email,"crm","view")))return NextResponse.json({error:"forbidden"},{status:403});
  const db=supabaseServer();
  const {data,error}=await db.from("customers").select("id,user_id,name,contact,email,address,created_at,updated_at,users:users!customers_user_id_fkey(full_name,email,phone,status)").order("created_at",{ascending:false}).limit(1000);
  if(error)return NextResponse.json({error:error.message},{status:500});
  const ids=(data||[]).map(customer=>customer.id);
  const {data:policies}=ids.length?await db.from("policies").select("customer_id,premium,status").in("customer_id",ids):{data:[]};
  const stats=new Map<string,{policies:number;activePolicies:number;premium:number}>();ids.forEach(id=>stats.set(id,{policies:0,activePolicies:0,premium:0}));
  (policies||[]).forEach(policy=>{const item=stats.get(policy.customer_id);if(item){item.policies++;if(policy.status==="active")item.activePolicies++;item.premium+=Number(policy.premium)||0}});
  const rows=(data||[]).map(customer=>({...customer,...stats.get(customer.id),accountStatus:(customer.users as any)?.status||"legacy"}));
  const now=new Date();
  return NextResponse.json({data:rows,metrics:{total:rows.length,registered:rows.filter(row=>Boolean(row.user_id)).length,active:rows.filter(row=>row.accountStatus==="active").length,newThisMonth:rows.filter(row=>{const date=new Date(row.created_at);return date.getMonth()===now.getMonth()&&date.getFullYear()===now.getFullYear()}).length,totalPolicies:rows.reduce((sum,row)=>sum+row.policies,0),totalPremium:rows.reduce((sum,row)=>sum+row.premium,0)}});
}
