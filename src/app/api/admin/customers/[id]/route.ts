import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth-server";
import { ensureAdminPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const decoded=await verifyRequestToken(request.headers.get("authorization"));
  if(!decoded)return NextResponse.json({error:"unauthenticated"},{status:401});
  if(!(await ensureAdminPermission(decoded.uid,decoded.email,"crm","view")))return NextResponse.json({error:"forbidden"},{status:403});
  const {id}=await params,db=supabaseServer();
  const {data:customer,error}=await db.from("customers").select("id,user_id,name,contact,email,address,created_at,updated_at,users:users!customers_user_id_fkey(full_name,email,phone,status,created_at)").eq("id",id).single();
  if(error||!customer)return NextResponse.json({error:"Customer not found."},{status:404});
  const [{data:policies},{data:quotes},{data:notes}]=await Promise.all([
    db.from("policies").select("id,policy_number,premium,coverage,start_date,expiry_date,status,created_at,products(name),insurers(name)").eq("customer_id",id).order("created_at",{ascending:false}),
    db.from("quotes").select("id,quote_reference,premium,coverage,validity_date,status,created_at,products(name),insurers(name)").eq("customer_id",id).order("created_at",{ascending:false}),
    db.from("customer_notes").select("id,body,created_at").eq("customer_id",id).order("created_at",{ascending:false}),
  ]);
  return NextResponse.json({data:{...customer,policies:policies||[],quotes:quotes||[],notes:notes||[]}});
}
