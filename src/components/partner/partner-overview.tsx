"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, FileText, RefreshCw, UserPlus, Users, WalletCards } from "lucide-react";
import { accessToken } from "@/lib/supabase-client";
import type { PartnerDashboardData } from "@/lib/partners/dashboard";
import { PartnerWelcome } from "./partner-welcome";
import { PartnerSkeleton } from "./partner-skeleton";
const money=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2});
const colors=["#8b5cf6","#38bdf8","#f472b6","#fbbf24","#34d399","#a78bfa","#fb923c"];
const date=(value:string)=>new Date(value).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Kolkata"});
export function PartnerOverview({name}:{name:string}) {
  const [data,setData]=useState<PartnerDashboardData|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const request=useRef<AbortController|null>(null),lastLoaded=useRef(0);
  const load=useCallback(async()=>{
    request.current?.abort();const controller=new AbortController();request.current=controller;setLoading(true);setError("");
    try { const token=await accessToken();if(controller.signal.aborted)return;const response=await fetch("/api/partner/dashboard",{headers:{Authorization:"Bearer "+token},cache:"no-store",signal:controller.signal});const body=await response.json();if(!response.ok)throw new Error(body.error||"Unable to load your dashboard.");if(!controller.signal.aborted){setData(body.data);lastLoaded.current=Date.now();} }
    catch(caught){if(!controller.signal.aborted)setError(caught instanceof Error?caught.message:"Unable to load your dashboard.");}
    finally{if(!controller.signal.aborted)setLoading(false);}
  },[]);
  useEffect(()=>{void load();const refresh=()=>{if(document.visibilityState==="visible"&&Date.now()-lastLoaded.current>=60000)void load();};const timer=setInterval(refresh,60000);window.addEventListener("focus",refresh);document.addEventListener("visibilitychange",refresh);return()=>{request.current?.abort();clearInterval(timer);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};},[load]);
  if(!data&&loading)return <PartnerSkeleton />;
  if(!data)return <section className="pd-card" role="alert"><p>{error||"Unable to load your dashboard."}</p><button onClick={()=>void load()}>Try again</button></section>;
  if(data.hasActivity===false)return <>{error&&<p role="alert" className="partner-error">{error} Showing your last loaded activity state.</p>}<PartnerWelcome name={name}/><div className="pd-live-toolbar"><small>Your reports will appear as you build your business.</small><button disabled={loading} onClick={()=>void load()}>{loading?"Refreshing...":"Refresh activity"}</button></div></>;
  const stats=[{label:"Total Leads",value:data.leads,detail:"Assigned to you",Icon:Users,tone:"violet"},{label:"Customers",value:data.customers,detail:"Your customer records",Icon:UserPlus,tone:"blue"},{label:"Policies Sold",value:data.policiesSold,detail:"Issued, active and expired",Icon:FileText,tone:"purple"},{label:"Recorded Earnings",value:money.format(data.totalEarnings),detail:"All statuses, net of adjustments",Icon:WalletCards,tone:"orange"}];
  const max=Math.max(4,...data.trend.map(m=>m.policies)),axis=Math.ceil(max/4)*4;
  let offset=0;const stops=data.categories.map((category,i)=>{const start=offset;offset+=category.percentage;return colors[i%colors.length]+" "+start+"% "+offset+"%";});
  return <>
    <section className="pd-welcome"><p>Welcome back,</p><h1>{name}</h1><small>Your business performance from your partner records.</small></section>
    <div className="pd-live-toolbar"><small>Updated {new Date(data.updatedAt).toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata"})} IST</small><button disabled={loading} onClick={()=>void load()}><RefreshCw size={16}/>{loading?"Refreshing...":"Refresh"}</button></div>
    {error&&<p className="partner-error" role="alert">{error} Showing the last successfully loaded figures.</p>}
    <section className="pd-stats">{stats.map(({label,value,detail,Icon,tone})=><article key={label}><i className={tone}><Icon/></i><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>)}</section>
    <section className="pd-dashboard-grid">
      <article className="pd-card pd-sales"><div className="pd-card-title"><h2>Sales Overview</h2><span>Last 6 months</span></div><p className="pd-live-note">Sold policies by record creation month (IST).</p>
        <div className="pd-chart" role="img" aria-label={data.trend.map(m=>m.label+": "+m.policies+" policies").join(", ")}><div className="pd-axis">{[4,3,2,1,0].map(step=><span key={step}>{axis*step/4}</span>)}</div>{data.trend.map(m=><div className="pd-bars" key={m.key}><div><i title={m.label+": "+m.policies+" policies"} style={{height:(m.policies/axis*100)+"%"}}/></div><span>{m.label}</span></div>)}</div>
        <div className="pd-earnings-trend"><h3>Recorded earnings by month</h3>{data.trend.map(m=><div key={m.key}><span>{m.label}</span><strong>{money.format(m.earnings)}</strong></div>)}</div>
      </article>
      <article className="pd-card pd-categories"><div className="pd-card-title"><h2>Policies by Category</h2><Link href="/partner/policies">View all</Link></div>{data.categories.length?<div className="pd-category-body"><div className="pd-donut" aria-hidden="true" style={{background:"conic-gradient("+stops.join(",")+")"}}><span><b>{data.policiesSold}</b>Policies</span></div><ul>{data.categories.map((c,i)=><li key={c.name}><i style={{background:colors[i%colors.length]}}/>{c.name}<b>{c.count} ({c.percentage.toFixed(1)}%)</b></li>)}</ul></div>:<p className="pd-empty">No issued policies yet. Your category breakdown will appear here.</p>}</article>
      <article className="pd-card"><h2>Performance Summary</h2><dl className="pd-live-summary"><div><dt>Premium on sold policies</dt><dd>{money.format(data.premium)}</dd></div><div><dt>Paid-status earnings, net</dt><dd>{money.format(data.paidEarnings)}</dd></div><div><dt>Unpaid earnings, net</dt><dd>{money.format(data.unpaidEarnings)}</dd></div><div><dt>Renewals due within 30 days</dt><dd>{data.renewalsDue}</dd></div></dl><p className="pd-live-note">Earnings include direct and network ledger entries, adjustments and clawbacks. Unpaid amounts may still be pending review; they are not a withdrawable balance.</p><Link href="/partner/earnings">View earnings</Link></article>
      <article className="pd-card pd-recent"><div className="pd-card-title"><h2>Recent Leads</h2><Link href="/partner/leads">View all</Link></div>{data.recentLeads.length?<div className="pd-table"><div className="head"><span>Name</span><span>Mobile</span><span>Product Interest</span><span>Status</span><span>Created On</span></div>{data.recentLeads.map(lead=><div key={lead.id}><span>{lead.name}</span><span>{lead.contact||"Not provided"}</span><span>{lead.product}</span><span>{lead.status.replaceAll("_"," ")}</span><span>{date(lead.created_at)}</span></div>)}</div>:<p className="pd-empty">No leads assigned yet. <Link href="/partner/leads">Open your leads</Link> to get started.</p>}</article>
      <div className="pd-side-stack"><article className="pd-card"><h2>Quick Actions</h2><div className="pd-quick">{[["Manage Leads","/partner/leads",Users],["Manage Customers","/partner/customers",UserPlus],["View Policies","/partner/policies",FileText],["Track Earnings","/partner/earnings",BarChart3]].map(([label,href,Icon])=>{const ActionIcon=Icon as typeof Users;return <Link key={String(href)} href={String(href)}><ActionIcon/><span>{String(label)}</span></Link>;})}</div></article><article className="pd-card pd-resources"><h2>Partner Resources</h2><Link href="/partner-resources">Browse partner resources</Link><br/><Link href="/contact">Contact support</Link></article></div>
    </section>
  </>;
}
