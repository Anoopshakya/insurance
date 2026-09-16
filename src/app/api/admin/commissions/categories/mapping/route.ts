import{NextRequest,NextResponse}from"next/server";import{z}from"zod";import{verifyRequestToken}from"@/lib/auth-server";import{ensureAdminPermission}from"@/lib/rbac";import{supabaseServer}from"@/lib/supabase-server";
async function allowed(req:NextRequest,action:string){const user=await verifyRequestToken(req.headers.get("authorization"));return user&&await ensureAdminPermission(user.uid,user.email,"commission_rules",action)}
export async function GET(req:NextRequest){
 if(!await allowed(req,"view"))return NextResponse.json({error:"forbidden"},{status:403});
 const db=supabaseServer(),id=req.nextUrl.searchParams.get("id");
 if(id&&!z.string().uuid().safeParse(id).success)return NextResponse.json({error:"Invalid category ID"},{status:400});
 const results=await Promise.all([
 db.from("categories").select("id,name,icon").order("sort_order"),
 db.from("product_types").select("id,name,category_id").order("sort_order"),
 db.from("insurers").select("id,name,logo_url").order("name"),
 id?db.from("company_commission_categories").select("id,name,category_id,product_type_id,active").eq("id",id).maybeSingle():Promise.resolve({data:null,error:null}),
 id?db.from("commission_category_company_mappings").select("insurer_id,commission_tier").eq("commission_category_id",id):Promise.resolve({data:[],error:null})]);
 const error=results.find(result=>result.error)?.error;
 if(error)return NextResponse.json({error:error.message},{status:500});
 if(id&&!results[3].data)return NextResponse.json({error:"Commission category not found"},{status:404});
 return NextResponse.json({sectors:results[0].data||[],types:results[1].data||[],companies:results[2].data||[],record:results[3].data,mappings:results[4].data||[]});
}
const schema=z.object({id:z.string().uuid().optional(),name:z.string().trim().min(2).max(100),categoryId:z.string().uuid(),productTypeId:z.string().uuid(),high:z.array(z.string().uuid()),average:z.array(z.string().uuid()),low:z.array(z.string().uuid())}).superRefine((v,c)=>{const all=[...v.high,...v.average,...v.low];if(new Set(all).size!==all.length)c.addIssue({code:"custom",message:"A company can only belong to one commission category"})});
export async function POST(req:NextRequest){
 if(!await allowed(req,"propose"))return NextResponse.json({error:"forbidden"},{status:403});
 try{const input=schema.parse(await req.json());
 const {data,error}=await supabaseServer().rpc("save_commission_category_mapping",{p_id:input.id||null,p_details:input});
 if(error)return NextResponse.json({error:error.code==="23505"?"A category already exists for this sector and product type. Edit that category or select another combination.":error.code==="PGRST202"?"Commission category saving needs the latest database migration. Please apply it and retry.":error.message},{status:400});
 return NextResponse.json({data},{status:input.id?200:201});
 }catch(e){return NextResponse.json({error:e instanceof z.ZodError?e.issues[0]?.message:"Could not save category mapping"},{status:400})}
}
