"use client";
import {useState} from 'react';
import {indiaDay,leadStatuses,nextFollowup,statusLabel} from '@/lib/lead-activity';
export function useLeadFilters(){return useState({quick:'all',status:'',assigned:'',product:'',created:'',followup:''})}
export function matchesLeadFilters(row:any,filters:any,currentUserId:string,partner=false,now=new Date()){
 const next=nextFollowup(row),today=indiaDay(now),owner=row.agent?.user_id||'';
 if(filters.quick==='mine'&&!partner&&owner!==currentUserId)return false;
 if(filters.quick==='today'&&(!next||indiaDay(next.scheduled_at)!==today))return false;
 if(filters.quick==='next7days'){
  if(['converted','lost'].includes(row.status))return false;
  const end=new Date(today+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+7);
  const endDay=end.toISOString().slice(0,10);
  const available=(row.followups||[]).some((followup:any)=>{
   const day=indiaDay(followup.scheduled_at);
   return followup.status==='scheduled'&&day>=today&&day<=endDay;
  });
  if(!available)return false;
 }
 if(filters.quick==='overdue'&&(!next||Date.parse(next.scheduled_at)>=now.getTime()))return false;
 if(['converted','lost'].includes(filters.quick)&&row.status!==filters.quick)return false;
 return (!filters.status||row.status===filters.status)&&(!filters.assigned||row.agent_id===filters.assigned)&&(!filters.product||(row.product_type_id||row.product_type)===filters.product)&&(!filters.created||indiaDay(row.created_at)===filters.created)&&(!filters.followup||(next&&(partner?indiaDay(next.scheduled_at):indiaDay(next.scheduled_at).slice(0,7))===filters.followup));
}
export function LeadFilters({rows,value,onChange,agents=[],products=[],currentUserId='',partner=false}:{rows:any[];value:any;onChange:(v:any)=>void;agents?:any[];products?:any[];currentUserId?:string;partner?:boolean}){
 const set=(key:string,v:string)=>onChange({...value,[key]:v});
 return <><div className="directory-tabs lead-activity-filters">{[['all','All Leads'],['mine','My Leads'],partner?['today','Follow-up Today']:['next7days','Follow-ups in Next 7 Days'],['overdue','Follow-up Overdue'],['converted','Converted'],['lost','Lost']].map(([key,label])=><button type="button" className={value.quick===key?'active':''} key={key} onClick={()=>set('quick',key)}>{label} ({rows.filter(r=>matchesLeadFilters(r,{quick:key},currentUserId,partner)).length})</button>)}</div><div className="lead-activity-filters"><label className="mp-label">Lead Status<select className="mp-control" value={value.status} onChange={e=>set('status',e.target.value)}><option value="">All statuses</option>{leadStatuses.map(s=><option key={s} value={s}>{statusLabel(s)} ({rows.filter(r=>r.status===s).length})</option>)}</select></label>{!partner&&<label className="mp-label">Assigned User<select className="mp-control" value={value.assigned} onChange={e=>set('assigned',e.target.value)}><option value="">All assigned users</option>{agents.map(a=><option key={a.id} value={a.id}>{(Array.isArray(a.users)?a.users[0]:a.users)?.full_name||a.agent_code}</option>)}</select></label>}<label className="mp-label">Product<select className="mp-control" value={value.product} onChange={e=>set('product',e.target.value)}><option value="">All products</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="mp-label">Created Date<input className="mp-control" type="date" value={value.created} onChange={e=>set('created',e.target.value)}/></label><label className="mp-label">{partner?"Next Follow-up Date":"Next Follow-up Month"}<input className="mp-control" type={partner?"date":"month"} value={value.followup} onChange={e=>set('followup',e.target.value)}/></label><button type="button" className="secondary-button" onClick={()=>onChange({quick:'all',status:'',assigned:'',product:'',created:'',followup:''})}>Reset filters</button></div></>;
}
