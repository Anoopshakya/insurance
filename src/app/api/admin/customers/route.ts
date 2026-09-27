import {z} from "zod";
import {createIdentityCode} from "@/lib/identity-code";
import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth-server";
import { ensureAdminPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request:NextRequest) {
  const decoded=await verifyRequestToken(request.headers.get("authorization"));
  if(!decoded)return NextResponse.json({error:"unauthenticated"},{status:401});
  if(!(await ensureAdminPermission(decoded.uid,decoded.email,"crm","view")))return NextResponse.json({error:"forbidden"},{status:403});
  const db=supabaseServer();
  const {data,error}=await db.from("customers").select("id,user_id,agent_id,customer_code,name,contact,email,address,created_at,updated_at,users:users!customers_user_id_fkey(full_name,email,phone,status)").order("created_at",{ascending:false}).limit(1000);
  if(error)return NextResponse.json({error:error.message},{status:500});
  const {data:partners,error:partnerError}=await db.from("agents").select("id,agent_code,status,users:users!agents_user_id_fkey(full_name)").order("agent_code");
  if(partnerError)return NextResponse.json({error:"Unable to load partner assignments."},{status:500});
  const ids=(data||[]).map(customer=>customer.id);
  const {data:policies}=ids.length?await db.from("policies").select("customer_id,premium,status").in("customer_id",ids):{data:[]};
  const stats=new Map<string,{policies:number;activePolicies:number;premium:number}>();ids.forEach(id=>stats.set(id,{policies:0,activePolicies:0,premium:0}));
  (policies||[]).forEach(policy=>{const item=stats.get(policy.customer_id);if(item){item.policies++;if(policy.status==="active")item.activePolicies++;item.premium+=Number(policy.premium)||0}});
  const rows=(data||[]).map(customer=>({...customer,...stats.get(customer.id),accountStatus:(customer.users as any)?.status||"legacy"}));
  const now=new Date();
  return NextResponse.json({data:rows,partners:partners||[],metrics:{total:rows.length,registered:rows.filter(row=>Boolean(row.user_id)).length,active:rows.filter(row=>row.accountStatus==="active").length,newThisMonth:rows.filter(row=>{const date=new Date(row.created_at);return date.getMonth()===now.getMonth()&&date.getFullYear()===now.getFullYear()}).length,totalPolicies:rows.reduce((sum,row)=>sum+row.policies,0),totalPremium:rows.reduce((sum,row)=>sum+row.premium,0)}});
}

const createSchema=z.object({name:z.string().trim().min(2,'Enter the customer name').max(100),contact:z.string().regex(/^[6-9]\d{9}$/,'Enter a valid 10-digit mobile number'),email:z.union([z.string().trim().email().max(254),z.literal('')]).optional(),address:z.string().trim().max(1000).optional(),agentId:z.string().uuid('Select a partner')});
export async function POST(request:NextRequest){
 const user=await verifyRequestToken(request.headers.get('authorization'));
 if(!user||!await ensureAdminPermission(user.uid,user.email,'crm','create'))return NextResponse.json({error:'You do not have permission to create customers.'},{status:403});
 try{const input=createSchema.parse(await request.json()),db=supabaseServer();
 const {data:agent,error:agentError}=await db.from('agents').select('id,status').eq('id',input.agentId).maybeSingle();
 if(agentError)return NextResponse.json({error:'Unable to verify partner. Please try again.'},{status:503});
 if(!agent||!['active','approved'].includes(agent.status))return NextResponse.json({error:'Select an active or approved partner.'},{status:400});
 const {data,error}=await db.from('customers').insert({name:input.name,contact:input.contact,email:input.email||null,address:input.address||null,agent_id:agent.id,customer_code:createIdentityCode('customer',input.name)}).select('id').single();
 if(error)return NextResponse.json({error:error.code==='23505'?'This email or mobile number is already registered.':error.message},{status:400});
 return NextResponse.json({data},{status:201});
 }catch(e){return NextResponse.json({error:e instanceof z.ZodError?e.issues.map(i=>i.message).join('\n'):'Unable to create customer.'},{status:400})}
}
