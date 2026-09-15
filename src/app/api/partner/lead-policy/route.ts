import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRequestToken } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase-server";
const schema = z.object({ leadId:z.string().uuid(), policyNumber:z.string().trim().min(3).max(80), sectorId:z.string().uuid(), productTypeId:z.string().uuid(), insurerId:z.string().uuid(), premium:z.coerce.number().positive().max(9999999999.99), coverage:z.coerce.number().nonnegative().max(999999999999.99).optional(), startDate:z.string().date(), tenureMonths:z.coerce.number().int().min(1).max(360), productId:z.string().uuid().optional().or(z.literal("")),planId:z.string().uuid().optional().or(z.literal("")), businessType:z.enum(["fresh","port","renew"]) });
export async function GET(request:NextRequest){
 const user=await verifyRequestToken(request.headers.get("authorization"));
 if(!user||user.role!=="partner")return NextResponse.json({error:"Forbidden"},{status:403});
 const db=supabaseServer();
 const [sectors,types,insurers,products,plans]=await Promise.all([db.from("categories").select("id,name").eq("active",true).order("name"),db.from("product_types").select("id,name,category_id").eq("active",true).order("name"),db.from("insurers").select("id,name").eq("active",true).order("name"),db.from("products").select("id,name,category_id").order("name"),db.from("plans").select("id,name,product_id,insurer_id").order("name")]);
 if(sectors.error||types.error||insurers.error||products.error||plans.error)return NextResponse.json({error:"Unable to load policy options"},{status:500});
 return NextResponse.json({sectors:sectors.data,productTypes:types.data,insurers:insurers.data,products:products.data,plans:plans.data},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(request:NextRequest){
 const user=await verifyRequestToken(request.headers.get("authorization"));
 if(!user||user.role!=="partner")return NextResponse.json({error:"Forbidden"},{status:403});
 try{
  const multipart=request.headers.get("content-type")?.includes("multipart/form-data");
  const form=multipart?await request.formData():null;
  const {leadId,...details}=schema.parse(form?Object.fromEntries(form):await request.json());
  const db=supabaseServer();let documentPath:string|null=null;
  const file=form?.get("policyDocument");
  if(file instanceof File&&file.size){
   if(file.size>5242880||!["application/pdf","image/jpeg","image/png"].includes(file.type))return NextResponse.json({error:"Upload a PDF, JPG or PNG under 5 MB"},{status:400});
   const {data:agent}=await db.from("agents").select("id,status").eq("user_id",user.uid).maybeSingle();
   if(!agent||!["active","approved"].includes(agent.status))return NextResponse.json({error:"Forbidden"},{status:403});
   const {data:lead}=await db.from("leads").select("id").eq("id",leadId).eq("agent_id",agent.id).maybeSingle();
   if(!lead)return NextResponse.json({error:"Lead not found"},{status:404});
   documentPath=`${agent.id}/${crypto.randomUUID()}.${file.type==="application/pdf"?"pdf":file.type==="image/png"?"png":"jpg"}`;
   const {error:uploadError}=await db.storage.from("policy-documents").upload(documentPath,Buffer.from(await file.arrayBuffer()),{contentType:file.type});
   if(uploadError)return NextResponse.json({error:"Unable to upload policy. Please try again."},{status:400});
  }
  const {data,error}=await supabaseServer().rpc("create_partner_lead_policy",{p_user_id:user.uid,p_lead_id:leadId,p_details:{...details,documentPath}});
  if(documentPath&&(error||data?.policy_document_path!==documentPath))await db.storage.from("policy-documents").remove([documentPath]);
  if(error)return NextResponse.json({error:error.code==="23505"?"This policy number or customer already exists. Please check the details.":error.code==="PGRST202"?"Policy creation is not configured yet. Please contact support.":error.message},{status:400});
  return NextResponse.json({data},{status:201});
 }catch(error){return NextResponse.json({error:error instanceof z.ZodError?error.issues[0]?.message:"Unable to create policy. Please try again."},{status:400})}
}
