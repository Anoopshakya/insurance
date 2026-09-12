export type DashboardPolicy = { id: string; status: string; created_at: string; expiry_date: string | null; premium: number | string; category: {name:string} | {name:string}[] | null };
export type DashboardEarning = { id:string; amount:number|string; status:string; created_at:string; generation_level:number };
export type DashboardAdjustment = { earning_id:string; amount_delta?:number|string; amount?:number|string };
const cents = (value: unknown) => { const n = Number(value); if (!Number.isFinite(n)) throw new Error("Invalid monetary value"); return Math.round(n * 100); };
const round = (n:number) => Math.round(n)/100;
export function indiaDate(value: string | Date) { return new Date(value).toLocaleDateString("en-CA", {timeZone:"Asia/Kolkata"}); }
export function summarizeDashboard(policies:DashboardPolicy[], earnings:DashboardEarning[], adjustments:DashboardAdjustment[], clawbacks:DashboardAdjustment[], now = new Date()) {
  const today=indiaDate(now), [year,month]=today.split("-").map(Number);
  const trend=Array.from({length:6},(_,i)=>{const d=new Date(Date.UTC(year,month-6+i,1));return {key:d.toISOString().slice(0,7),label:d.toLocaleDateString("en-IN",{month:"short",year:"2-digit",timeZone:"UTC"}),policies:0,earnings:0};});
  const sold=policies.filter(p=>["issued","active","expired"].includes(p.status));
  const categoryMap=new Map<string,number>();
  for(const p of sold){const category=(Array.isArray(p.category)?p.category[0]:p.category)?.name||"Uncategorised";categoryMap.set(category,(categoryMap.get(category)||0)+1);const bucket=trend.find(m=>m.key===indiaDate(p.created_at).slice(0,7));if(bucket)bucket.policies++;}
  const net=new Map(earnings.map(e=>[e.id,cents(e.amount)]));
  for(const a of adjustments)if(net.has(a.earning_id))net.set(a.earning_id,net.get(a.earning_id)!+cents(a.amount_delta));
  for(const c of clawbacks)if(net.has(c.earning_id))net.set(c.earning_id,net.get(c.earning_id)!-cents(c.amount));
  let total=0,paid=0,pending=0;
  for(const e of earnings){const amount=net.get(e.id)!;total+=amount;if(e.status==="paid")paid+=amount;else pending+=amount;const bucket=trend.find(m=>m.key===indiaDate(e.created_at).slice(0,7));if(bucket)bucket.earnings+=amount;}
  const renewalEnd=new Date(today+"T00:00:00Z");renewalEnd.setUTCDate(renewalEnd.getUTCDate()+30);
  return {policiesSold:sold.length,totalEarnings:round(total),paidEarnings:round(paid),unpaidEarnings:round(pending),premium:round(sold.reduce((sum,p)=>sum+cents(p.premium),0)),renewalsDue:policies.filter(p=>["active","issued"].includes(p.status)&&p.expiry_date&&p.expiry_date>=today&&p.expiry_date<=renewalEnd.toISOString().slice(0,10)).length,categories:[...categoryMap].map(([name,count])=>({name,count,percentage:sold.length?count/sold.length*100:0})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)),trend:trend.map(m=>({...m,earnings:round(m.earnings)}))};
}
// Supabase caps result sets; request stable pages so totals never silently stop at that cap.
export async function dashboardRows<T>(query: (from:number,to:number)=>PromiseLike<{data:T[]|null;error:unknown}>) {
  const rows:T[]=[];const size=500;
  for(let from=0;;from+=size){const result=await query(from,from+size-1);if(result.error)throw new Error("Unable to load dashboard records");if(!result.data)throw new Error("Dashboard records missing");rows.push(...result.data);if(result.data.length<size)return rows;}
}
export function hasPartnerActivity(counts: {leads:number;customers:number;quotes:number;policies:number;earnings:number}) { return Object.values(counts).some(count=>count>0); }
export type PartnerDashboardData = ReturnType<typeof summarizeDashboard> & {hasActivity:boolean;leads:number;customers:number;updatedAt:string;recentLeads:Array<{id:string;name:string;contact:string|null;status:string;created_at:string;product:string}>};
