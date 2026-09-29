"use client";
import {useEffect,useRef} from "react";
import {createPortal} from "react-dom";
import {PolicyDocument} from "./policy-document";
export function PolicyDetails({policy,close}:{policy:any;close:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const trigger=document.activeElement as HTMLElement|null;const el=dialog.current;el?.showModal();return()=>{el?.close();trigger?.focus()}},[]);
 const money=(v:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(v||0);
 const fields=[['Customer',policy.customer?.name],['Mobile',policy.customer?.contact],['Partner',policy.agent?.users?.full_name||policy.agent?.agent_code],['Sector',policy.sector?.name],['Product',policy.productType?.name||policy.product?.name],['Insurer',policy.insurer?.name],['Plan',policy.plan?.name],['Start Date',policy.start_date],['Renewal Date',policy.expiry_date],['Premium',money(policy.premium)],['Coverage',money(policy.coverage)]];
 return createPortal(<dialog ref={dialog} className="admin-modal ap-form" style={{maxHeight:'calc(100dvh - 2rem)',overflowY:'auto'}} aria-label="Policy Details" onCancel={e=>{e.preventDefault();close()}}><header><h2>Policy Details</h2><button type="button" aria-label="Close policy details" onClick={close}>Close</button></header><h3>{policy.policy_number}</h3><dl>{fields.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'—'}</dd></div>)}</dl>{policy.policy_document_path&&<PolicyDocument id={policy.id}/>}</dialog>,document.body);
}
