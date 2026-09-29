import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {recordModules} from "@/lib/admin-records";
import {verifyRequestToken} from "@/lib/auth-server";
import {ensureAdminPermission} from "@/lib/rbac";
import {supabaseServer} from "@/lib/supabase-server";
type Context={params:Promise<{module:string;id:string}>};
async function mutate(req:NextRequest,context:Context,remove:boolean){
 const {module,id}=await context.params;const config=Object.hasOwn(recordModules,module)?recordModules[module]:undefined;
 if(!config||!z.string().uuid().safeParse(id).success)return NextResponse.json({error:'Record not found.'},{status:404});
 const user=await verifyRequestToken(req.headers.get('authorization'));
 if(!user||!await ensureAdminPermission(user.uid,user.email,config.permission,remove?'delete':'edit'))return NextResponse.json({error:'You do not have permission for this action.'},{status:403});
 try{const db=supabaseServer();let result;
 if(remove){
 const deletion=db.from(config.table).delete().eq('id',id);
 // Check status in the deletion itself, including when a stale page submits a request.
 if(module==='policies')deletion.eq('status','cancelled');
 result=await deletion.select('id').maybeSingle();
 if(module==='policies'&&!result.error&&!result.data)return NextResponse.json({error:'Only cancelled policies can be deleted. The policy may have changed or already been removed.'},{status:409});
 }
 else{
 if(!config.fields.length)return NextResponse.json({error:'Use the dedicated editor for this record.'},{status:400});
 const body=await req.json();const shape:Record<string,z.ZodTypeAny>={};
 for(const field of config.fields){let value:z.ZodTypeAny=z.string().trim().max(field.max||4000);if(field.type==='number')value=z.coerce.number().finite().nonnegative();else if(field.type==='select')value=z.string().refine(v=>field.options!.includes(v),'Select a valid '+field.label);else if(field.type==='tel')value=z.string().regex(field.required?/^[6-9]\d{9}$/:/^(?:[6-9]\d{9})?$/,'Enter a valid 10-digit mobile number');else if(field.type==='email')value=z.union([z.string().email(),z.literal('')]);else if(field.required)value=z.string().trim().min(field.key==='message'?10:2).max(field.max||4000);shape[field.key]=value;}
 const parsed=z.object(shape).strict().safeParse(body);if(!parsed.success)return NextResponse.json({error:parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('\n')},{status:400});
 result=await db.from(config.table).update({...parsed.data,...(module==='contact-requests'?{}:{updated_at:new Date().toISOString()})}).eq('id',id).select('id').maybeSingle();
 }
 if(result.error?.code==='23503'&&module==='policies'){
 const detail=[result.error.message,result.error.details].filter(Boolean).join(' ');
 const error=detail.includes('policy_review_history')
 ? 'Policy review history is blocking deletion. Apply database migration 202609280001_policy_review_history_delete.sql and retry.'
 : /earning_ledger|clawbacks/.test(detail)
 ? 'This cancelled policy has commission or clawback records and cannot be permanently deleted. Its financial history must be retained.'
 : 'This cancelled policy is still linked to other records and cannot be permanently deleted.';
 return NextResponse.json({error},{status:409});
 }
 if(result.error)return NextResponse.json({error:result.error.code==='23503'?'This record is linked to other records. Remove or reassign those links before deleting it.':result.error.code==='23505'?'Another record already uses these details.':result.error.message},{status:409});
 if(!result.data)return NextResponse.json({error:'Record not found or already deleted.'},{status:404});return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Unable to complete the action. Please check your details and try again.'},{status:400})}
}
export const PATCH=(req:NextRequest,ctx:Context)=>mutate(req,ctx,false);
export const DELETE=(req:NextRequest,ctx:Context)=>mutate(req,ctx,true);
