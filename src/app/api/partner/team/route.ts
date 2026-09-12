import {NextRequest,NextResponse} from "next/server";
import {verifyRequestToken} from "@/lib/auth-server";
import {supabaseServer} from "@/lib/supabase-server";
export async function GET(req:NextRequest){
 const user=await verifyRequestToken(req.headers.get("authorization"));
 if(!user||user.role!=="partner")return NextResponse.json({error:"Forbidden"},{status:403});
 const db=supabaseServer();
 const {data:agent,error:agentError}=await db.from("agents").select("id,invite_code,invite_enabled,invite_expires_at,status").eq("user_id",user.uid).single();
 if(agentError||!agent)return NextResponse.json({error:"Unable to load your team. Please try again or contact support."},{status:503});
 const page=Math.max(1,Math.min(100000,Math.floor(Number(req.nextUrl.searchParams.get("page")))||1));
 const depth=Number(req.nextUrl.searchParams.get("level"))||0;
 let query=db.from("network_closure").select("depth,member:agents!network_closure_descendant_id_fkey(id,agent_code,status,region,created_at,users:users!agents_user_id_fkey(full_name))",{count:"exact"}).eq("ancestor_id",agent.id).gt("depth",0);
 if([1,2,3].includes(depth))query=query.eq("depth",depth);
 const [members,ancestry,...counts]=await Promise.all([
  query.order("depth").order("descendant_id").range((page-1)*20,page*20-1),
  db.from("network_closure").select("depth").eq("descendant_id",agent.id).order("depth",{ascending:false}).limit(1),
  ...[1,2,3].map(level=>db.from("network_closure").select("descendant_id",{count:"exact",head:true}).eq("ancestor_id",agent.id).eq("depth",level)),
 ]);
 if(members.error||ancestry.error||counts.some(c=>c.error))return NextResponse.json({error:"Unable to load team members. Please try again."},{status:500});
 const canInvite=agent.invite_enabled&&!['suspended','rejected','deactivated'].includes(agent.status)&&(!agent.invite_expires_at||Date.parse(agent.invite_expires_at)>Date.now())&&(ancestry.data?.[0]?.depth||0)<3;
 return NextResponse.json({code:agent.invite_code,canInvite,expiresAt:agent.invite_expires_at,members:members.data,total:members.count||0,counts:counts.map(c=>c.count||0),page},{headers:{"Cache-Control":"private, no-store"}});
}
