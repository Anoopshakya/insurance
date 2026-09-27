import {supabaseServer} from "@/lib/supabase-server";
import {createIdentityCode} from "@/lib/identity-code";
export async function partnerCustomer(db:ReturnType<typeof supabaseServer>,agentId:string):Promise<string>{
 const {data:agent,error}=await db.from('agents').select('id,user_id,users:users!agents_user_id_fkey(full_name,email,phone)').eq('id',agentId).maybeSingle();
 if(error||!agent)throw Error('Selected partner could not be loaded.');
 const user=Array.isArray(agent.users)?agent.users[0]:agent.users;
 if(!agent.user_id||!user?.full_name)throw Error('Complete the partner profile before using it as a customer.');
 const existing=await db.from('customers').select('id').eq('user_id',agent.user_id).maybeSingle();
 if(existing.error)throw Error('Unable to check the partner customer record.');
 if(existing.data)return existing.data.id;
 const phone=user.phone?.replace(/[\s()+-]/g,'').replace(/^91(?=\d{10}$)/,'')||null;
 const created=await db.from('customers').insert({user_id:agent.user_id,agent_id:agent.id,name:user.full_name,email:user.email||null,contact:phone,customer_code:createIdentityCode('customer',user.full_name)}).select('id').single();
 if(created.error){if(created.error.code==='23505'){const retry=await db.from('customers').select('id').eq('user_id',agent.user_id).maybeSingle();if(!retry.error&&retry.data)return retry.data.id;throw Error('A customer already uses this partner?s email or mobile. Resolve the duplicate customer details first.');}throw Error('Unable to create a customer record for the partner.');}
 return created.data.id;
}
