import {NextRequest,NextResponse} from "next/server";
import {pdfSuggestions} from "@/lib/product-pdf";
import {PDFParse} from "pdf-parse";
import {verifyRequestToken} from "@/lib/auth-server";
import {ensureAdminPermission} from "@/lib/rbac";
import {supabaseServer} from "@/lib/supabase-server";
import {z} from "zod";
export const runtime="nodejs";
export const maxDuration=60;
export async function POST(req:NextRequest){
 const user=await verifyRequestToken(req.headers.get('authorization'));if(!user||!await ensureAdminPermission(user.uid,user.email,'catalog','edit'))return NextResponse.json({error:'Forbidden'},{status:403});
 let parser:PDFParse|undefined;
 try{const form=await req.formData(),id=z.string().uuid().parse(form.get('productId')),kind=z.enum(['brochure','policy_wording','supporting']).parse(form.get('documentType')),file=form.get('document');
 if(!(file instanceof File)||file.type!=='application/pdf'||file.size>10485760||file.size===0)return NextResponse.json({error:'Choose a PDF up to 10 MB'},{status:400});
 const db=supabaseServer(),{data:product}=await db.from('products').select('id,publication_status').eq('id',id).maybeSingle();if(!product)return NextResponse.json({error:'Product not found'},{status:404});if(product.publication_status==='published')return NextResponse.json({error:'Save as draft before replacing or adding source documents'},{status:409});
 const bytes=new Uint8Array(await file.arrayBuffer());if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return NextResponse.json({error:'Invalid PDF file'},{status:400});
 parser=new PDFParse({data:bytes.slice()});const info=await parser.getInfo();if(info.total>100)return NextResponse.json({error:'Upload documents with 100 pages or fewer'},{status:400});const result=await parser.getText();
 const pages=result.pages.map(p=>({page:p.num,text:p.text}));if(result.text.length>1000000)return NextResponse.json({error:'Document text exceeds the import limit. Split the PDF and retry.'},{status:400});
 const path=`${id}/${crypto.randomUUID()}.pdf`,bucket=db.storage.from('product-documents');const {error:uploadError}=await bucket.upload(path,bytes,{contentType:'application/pdf'});if(uploadError)throw uploadError;
 const {data,error}=await db.from('product_documents').insert({product_id:id,file_url:path,name:file.name,document_type:kind,extracted_pages:pages}).select().single();if(error){await bucket.remove([path]);throw error;}
 return NextResponse.json({data,suggestions:pdfSuggestions(pages),warning:result.text.trim().length<50?'This PDF appears scanned. Text extraction is incomplete; use an OCR copy or enter details manually.':'Review extracted text against the PDF, especially tables, limits and exclusions.'});
 }catch(e){return NextResponse.json({error:e instanceof z.ZodError?'Invalid document details':'Unable to import this PDF. Check that it is readable and not password-protected.'},{status:400})}finally{await parser?.destroy()}
}
