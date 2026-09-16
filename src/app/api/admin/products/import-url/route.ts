import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {verifyRequestToken} from "@/lib/auth-server";
import {ensureAdminPermission} from "@/lib/rbac";
import {fetchProductWebsite} from "@/lib/product-url-fetch";
import {extractProductWebsite} from "@/lib/product-website-import";
export const runtime='nodejs';export const maxDuration=30;
export async function POST(req:NextRequest){const user=await verifyRequestToken(req.headers.get('authorization'));if(!user||!await ensureAdminPermission(user.uid,user.email,'catalog','edit'))return NextResponse.json({error:'Forbidden'},{status:403});try{const {url}=z.object({url:z.string().url().max(2000)}).parse(await req.json());const page=await fetchProductWebsite(url);return NextResponse.json(extractProductWebsite(page.html,page.url),{headers:{'Cache-Control':'private, no-store'}});}catch(e){return NextResponse.json({error:e instanceof z.ZodError?'Enter a valid product website URL.':e instanceof Error?e.message:'Unable to import website'},{status:400})}}
