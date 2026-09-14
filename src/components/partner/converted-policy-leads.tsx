"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { LeadPolicyForm } from "./lead-policy-form";
type Lead = { id:string; product_sector_id?:string; product_type_id?:string; policy?:Array<{id:string;policy_number:string;status:string;review_status?:string;review_note?:string}>; name:string; contact:string|null; status:string; updated_at:string; product_sector:{name:string}|null; product_type:{name:string}|null };
export function ConvertedPolicyLeads({rows,onCreated}:{rows:Lead[];onCreated:()=>void}) {
 const [creating,setCreating]=useState<Lead|null>(null);
 const [search,setSearch]=useState(""),[page,setPage]=useState(1);
 const filtered=useMemo(()=>rows.filter(row=>[row.name,row.contact,row.product_sector?.name,row.product_type?.name].join(" ").toLowerCase().includes(search.trim().toLowerCase())),[rows,search]);
 const pages=Math.max(1,Math.ceil(filtered.length/20)),current=Math.min(page,pages),visible=filtered.slice((current-1)*20,current*20);
 if(!rows.length)return null;
 return <section className="pp-directory" style={{marginBottom:20}} aria-label="Converted leads"><header><div><h2>Converted Leads</h2><small>{rows.length} converted leads · Policy details appear once a policy is created.</small></div><Link href="/partner/leads">Manage leads</Link></header>
 <div className="pp-filters"><label><input aria-label="Search converted leads" placeholder="Search name, mobile or product" value={search} onChange={event=>{setSearch(event.target.value);setPage(1)}}/></label></div>
 <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",textAlign:"left"}}><thead><tr>{["Name","Mobile","Product","Last updated","Status","Policy"].map(label=><th key={label} style={{padding:14}}>{label}</th>)}</tr></thead><tbody>{visible.map(row=><tr key={row.id}><td style={{padding:14}}>{row.name}</td><td style={{padding:14}}>{row.contact?<a href={`tel:${row.contact}`}>{row.contact}</a>:"Not provided"}</td><td style={{padding:14}}>{row.product_type?.name||row.product_sector?.name||"Not specified"}</td><td style={{padding:14}}>{new Date(row.updated_at).toLocaleDateString("en-IN")}</td><td style={{padding:14}}><span className="pp-status">Converted</span></td><td style={{padding:14}}>{row.policy?.length?<span>{row.policy[0].policy_number}<br/>Review: {row.policy[0].review_status||row.policy[0].status}{row.policy[0].review_note&&<small>{row.policy[0].review_note}</small>}</span>:<button className="lead-policy-create" onClick={()=>setCreating(row)}>Mark as policy</button>}</td></tr>)}</tbody></table></div>
 {!visible.length&&<p className="pp-state">No converted leads match your search.</p>}
 {pages>1&&<div className="pp-filters"><button disabled={current===1} onClick={()=>setPage(current-1)}>Previous</button><span>Page {current} of {pages}</span><button disabled={current===pages} onClick={()=>setPage(current+1)}>Next</button></div>}
 {creating&&<LeadPolicyForm lead={creating} close={()=>setCreating(null)} saved={()=>{setCreating(null);onCreated()}}/>}
 </section>;
}
