import {NextRequest,NextResponse} from "next/server";
import {supabaseServer} from "@/lib/supabase-server";
export async function GET(req:NextRequest){
 const code=req.cookies.get("partner_invite")?.value;
 const headers={"Cache-Control":"private, no-store"};
 if(!code)return NextResponse.json({invited:false},{headers});
 const {data,error}=await supabaseServer().from("agents").select("id,status,invite_enabled,invite_expires_at,users:users!agents_user_id_fkey(full_name)").eq("invite_code",code).maybeSingle();
 if(error)return NextResponse.json({error:"Invitation could not be checked. Please try again."},{status:503,headers});
 if(!data||!data.invite_enabled||['suspended','rejected','deactivated'].includes(data.status)||(data.invite_expires_at&&Date.parse(data.invite_expires_at)<=Date.now()))return NextResponse.json({error:"This invitation is invalid or expired. Ask for a new invite link or continue without an invitation."},{status:400,headers});
 return NextResponse.json({invited:true,name:(Array.isArray(data.users)?data.users[0]:data.users)?.full_name||"your inviter"},{headers});
}
export async function DELETE(req:NextRequest){
 if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Forbidden"},{status:403});
 const response=NextResponse.json({ok:true});response.cookies.delete("partner_invite");return response;
}
