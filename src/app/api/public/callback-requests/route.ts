import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {supabaseServer} from "@/lib/supabase-server";
const schema=z.object({mobile:z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'),whatsapp:z.boolean(),sourcePath:z.string().max(200).startsWith('/'),consent:z.literal(true),website:z.string().max(0).optional()});
export async function POST(request:NextRequest){
 const body=await request.json().catch(()=>null);const parsed=schema.safeParse(body);
 if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0].message},{status:400});
 const {mobile,whatsapp,sourcePath}=parsed.data;
 try{const {error}=await supabaseServer().from('website_contact_requests').insert({name:'Website callback (name not provided)',mobile,email:'',state:'',consent:true,message:`Insurance assistance callback requested from ${sourcePath}. WhatsApp updates: ${whatsapp?'Opted in':'Not opted in'}.`});if(error)throw error;return NextResponse.json({ok:true},{status:201});}catch{return NextResponse.json({error:'Unable to request a callback. Please try again.'},{status:503})}
}
