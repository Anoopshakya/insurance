import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {verifyRequestToken} from '@/lib/auth-server';
import {ensureAdminPermission} from '@/lib/rbac';
import {supabaseServer} from '@/lib/supabase-server';
const identity=z.object({id:z.string().uuid(),kind:z.enum(['internal','website']),scope:z.enum(['admin','partner'])});
async function authorize(req:NextRequest,input:z.infer<typeof identity>,action:string){
 const actor=await verifyRequestToken(req.headers.get('authorization'));if(!actor)return null;
 const db=supabaseServer();
 if(input.scope==='partner'){
  if(actor.role!=='partner'||input.kind!=='internal')return null;
  const {data:agent}=await db.from('agents').select('id,status').eq('user_id',actor.uid).maybeSingle();
  if(!agent||['suspended','rejected','deactivated'].includes(agent.status))return null;
  const {data:lead}=await db.from('leads').select('id').eq('id',input.id).eq('agent_id',agent.id).maybeSingle();if(!lead)return null;
 }else if(!await ensureAdminPermission(actor.uid,actor.email,'leads',action))return null;
 return actor;
}
export async function GET(req:NextRequest){try{
 const input=identity.parse(Object.fromEntries(req.nextUrl.searchParams));const actor=await authorize(req,input,'view');if(!actor)return NextResponse.json({error:'Forbidden'},{status:403});
 const db=supabaseServer(),key=input.kind==='internal'?'lead_id':'website_lead_id';
 const [lead,followups,history]=await Promise.all([
 db.from(input.kind==='internal'?'leads':'website_quote_requests').select('*').eq('id',input.id).maybeSingle(),
 db.from('lead_followups').select('*,creator:users!created_by(full_name),completer:users!completed_by(full_name)').eq(key,input.id).order('scheduled_at'),
 db.from('lead_status_history').select('*,actor:users!changed_by(full_name)').eq(key,input.id).order('changed_at',{ascending:false})]);
 const error=lead.error||followups.error||history.error;if(error)throw Error(error.message);
 if(!lead.data)return NextResponse.json({error:'Lead not found'},{status:404});
 return NextResponse.json({lead:lead.data,followups:followups.data,history:history.data});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to load activity'},{status:400})}}
const schema=identity.extend({action:z.enum(['schedule','reschedule','complete','cancel']),followupId:z.string().uuid().optional(),requestId:z.string().uuid().optional(),scheduledAt:z.string().datetime({offset:true}).optional(),followupType:z.enum(['call','whatsapp','email','meeting','other']).optional(),note:z.string().trim().max(4000).optional()});
export async function POST(req:NextRequest){try{
 const input=schema.parse(await req.json());const actor=await authorize(req,input,'edit');if(!actor)return NextResponse.json({error:'Forbidden'},{status:403});
 if(input.action!=='schedule'&&!input.followupId)throw Error('Select a follow-up');
 if(['schedule','reschedule'].includes(input.action)&&(!input.requestId||!input.scheduledAt||!input.followupType||Date.parse(input.scheduledAt)<=Date.now()))throw Error('Choose a future follow-up date, time and type.');
 const {data,error}=await supabaseServer().rpc('manage_lead_activity',{p_kind:input.kind,p_id:input.id,p_actor:actor.uid,p_action:input.action,p_data:input});if(error)throw Error(error.message);
 return NextResponse.json({data});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to save follow-up'},{status:400})}}
