export const leadStatuses=['new','contacted','qualified','proposal','converted','lost'] as const;
export const statusLabel=(value:string)=>value==='proposal'?'Quote / Proposal Shared':value.charAt(0).toUpperCase()+value.slice(1);
export const lostReasons=['Not Interested','Premium Too High','Bought From Competitor','Unable to Contact','Invalid Lead','Duplicate Lead','Requirement Changed','Other'];
export const indiaDay=(value:string|Date)=>new Date(value).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
export const activityDate=(value:string)=>new Date(value).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'});
export function nextFollowup(row:any){return ['converted','lost'].includes(row.status)?null:[...(row.followups||[])].filter((f:any)=>f.status==='scheduled').sort((a:any,b:any)=>a.scheduled_at.localeCompare(b.scheduled_at))[0]||null;}
