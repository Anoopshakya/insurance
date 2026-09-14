import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {verifyRequestToken} from "@/lib/auth-server";
import {ensureAdminPermission} from "@/lib/rbac";
import {supabaseServer} from "@/lib/supabase-server";
const schema=z.object({id:z.string().uuid(),decision:z.enum(["approved","hold","rejected"]),note:z.string().trim().max(2000).default(""),expectedStatus:z.enum(["pending","hold"])}).refine(v=>v.decision==="approved"||v.note.length>0,{message:"Enter a reason for holding or rejecting the policy"});
export async function POST(request:NextRequest){
 const user=await verifyRequestToken(request.headers.get("authorization"));
 if(!user||!await ensureAdminPermission(user.uid,user.email,"quotes_policies","edit"))return NextResponse.json({error:"Forbidden"},{status:403});
 try{
 const input=schema.parse(await request.json());
 const {data,error}=await supabaseServer().rpc("review_partner_policy",{p_policy_id:input.id,p_user_id:user.uid,p_decision:input.decision,p_note:input.note,p_expected_status:input.expectedStatus});
 return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({data});
 }catch(error){return NextResponse.json({error:error instanceof z.ZodError?error.issues[0]?.message:"Unable to review policy"},{status:400})}
}
