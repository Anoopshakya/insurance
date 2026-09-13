import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase-server";
import { createAgentCode } from "@/lib/partners/service";

export async function POST(req: NextRequest) {
 const decoded = await verifyRequestToken(req.headers.get("authorization"));
 if (!decoded) return NextResponse.json({error:"Unauthenticated"},{status:401});
 const db=supabaseServer();
 const {data:{user},error:authError}=await db.auth.admin.getUserById(decoded.uid);
 if(authError||!user) return NextResponse.json({error:"Authentication account not found"},{status:401});
 const meta=user.user_metadata||{};
 const fullName=String(meta.full_name||meta.name||"New Partner");
 const {data,error}=await db.rpc("register_partner",{
   p_user_id:decoded.uid,p_email:user.email?.toLowerCase()||null,
   p_phone:String(meta.mobile||user.phone||"")||null,
   p_name:fullName,p_agent_code:createAgentCode(fullName),
   p_invite:req.cookies.get("partner_invite")?.value||null,
 });
 if(error) return NextResponse.json({error:error.message},{status:400});
 const response=NextResponse.json({data},{headers:{"Cache-Control":"private, no-store"}});
 response.cookies.delete("partner_invite");
 return response;
}
