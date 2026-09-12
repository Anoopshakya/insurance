import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
export async function GET(req:NextRequest,{params}:{params:Promise<{code:string}>}){
 const {code}=await params;
 let valid=false;
 if(/^[a-f0-9]{64}$/.test(code)){
  const {data,error}=await supabaseServer().from("agents").select("id,status,invite_enabled,invite_expires_at").eq("invite_code",code).maybeSingle();
  if(error)return new NextResponse("Invitation could not be checked. Please try again.",{status:503});
  valid=!!data&&data.invite_enabled&&!['suspended','rejected','deactivated'].includes(data.status)&&(!data.invite_expires_at||Date.parse(data.invite_expires_at)>Date.now());
 }
 const target=new URL("/partner/register?account=1"+(valid?"&invited=1":"&inviteError=1"),req.url);
 const response=NextResponse.redirect(target);
 response.headers.set("Cache-Control","private, no-store");
 response.headers.set("Referrer-Policy","no-referrer");
 // HTTP-only, same-origin cookie survives reloads and the Google popup/redirect.
 // Invalid links overwrite older attribution so they cannot silently use another inviter.
 response.cookies.set("partner_invite",valid?code:"invalid",{httpOnly:true,secure:req.nextUrl.protocol==="https:",sameSite:"lax",path:"/",maxAge:60*60*24*30});
 return response;
}
