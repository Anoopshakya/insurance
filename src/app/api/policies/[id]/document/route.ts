import {NextRequest,NextResponse} from "next/server";
import {verifyRequestToken} from "@/lib/auth-server";
import {ensureAdminPermission} from "@/lib/rbac";
import {supabaseServer} from "@/lib/supabase-server";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const user=await verifyRequestToken(request.headers.get("authorization"));if(!user)return NextResponse.json({error:"Forbidden"},{status:403});
 const db=supabaseServer(),{id}=await params;let query=db.from("policies").select("policy_document_path").eq("id",id);
 if(!await ensureAdminPermission(user.uid,user.email,"quotes_policies","view")){
 if(user.role!=="partner")return NextResponse.json({error:"Forbidden"},{status:403});
 const {data:agent}=await db.from("agents").select("id").eq("user_id",user.uid).maybeSingle();if(!agent)return NextResponse.json({error:"Forbidden"},{status:403});query=query.eq("agent_id",agent.id);
 }
 const {data}=await query.maybeSingle();if(!data?.policy_document_path)return NextResponse.json({error:"Document not found"},{status:404});
 const {data:signed,error}=await db.storage.from("policy-documents").createSignedUrl(data.policy_document_path,300);
 return error?NextResponse.json({error:"Unable to open document"},{status:500}):NextResponse.json({url:signed?.signedUrl},{headers:{"Cache-Control":"private, no-store"}});
}
