import{NextRequest,NextResponse}from"next/server";import{z}from"zod";import{verifyRequestToken}from"@/lib/auth-server";import{ensureAdminPermission}from"@/lib/rbac";import{supabaseServer}from"@/lib/supabase-server";
const schema=z.object({categoryId:z.string().uuid().optional(),productTypeId:z.string().uuid().optional(),high:z.coerce.number().int().min(0).optional(),average:z.coerce.number().int().min(0).optional(),low:z.coerce.number().int().min(0).optional(),active:z.boolean().optional()});
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){const decoded=await verifyRequestToken(req.headers.get("authorization"));if(!decoded||!(await ensureAdminPermission(decoded.uid,decoded.email,"commission_rules","propose")))return NextResponse.json({error:"forbidden"},{status:403});try{const{id}=await params,input=schema.parse(await req.json());const row={...(input.categoryId?{category_id:input.categoryId}:{}),...(input.productTypeId?{product_type_id:input.productTypeId}:{}),...(input.high!==undefined?{high_commission_companies:input.high}:{}),...(input.average!==undefined?{average_commission_companies:input.average}:{}),...(input.low!==undefined?{low_commission_companies:input.low}:{}),...(input.active!==undefined?{active:input.active}:{}),updated_at:new Date().toISOString()};const{data,error}=await supabaseServer().from("company_commission_categories").update(row).eq("id",id).select().single();return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({data})}catch(error){return NextResponse.json({error:error instanceof z.ZodError?error.issues[0]?.message:"Invalid update"},{status:400})}}

export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const user=await verifyRequestToken(req.headers.get("authorization"));
 if(!user||!await ensureAdminPermission(user.uid,user.email,"commission_rules","propose"))return NextResponse.json({error:"Forbidden"},{status:403});
 try{
 const id=z.string().uuid().parse((await params).id);
 const {data,error}=await supabaseServer().from("company_commission_categories").delete().eq("id",id).select("id").maybeSingle();
 if(error){
  if(error.code==="23503"){
   const {data:slabs}=await supabaseServer().from("partner_commission_slabs").select("id,name").eq("commission_category_id",id).limit(10);
   return NextResponse.json({error:`This category is used by commission slabs${slabs?.length?": "+slabs.map(s=>s.name).join(", "):""}. Reassign or remove the slab before deleting the category. You can also mark the category inactive.`,slabs:slabs||[]},{status:409});
  }
  return NextResponse.json({error:"Unable to delete commission category. Please try again."},{status:500});
 }
 if(!data)return NextResponse.json({error:"Commission category not found"},{status:404});
 return NextResponse.json({ok:true});
 }catch(error){return NextResponse.json({error:error instanceof z.ZodError?"Invalid category ID":"Unable to delete commission category"},{status:error instanceof z.ZodError?400:500})}
}
