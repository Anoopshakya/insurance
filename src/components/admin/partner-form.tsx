"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import { Icon } from "@/components/admin/icons";

const STATES = ["Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh","Chhattisgarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Lakshadweep","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

async function authorizedFetch(url: string, init: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  return fetch(url, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` } });
}

type Detail = { agent_code:string; agency_name?:string|null; designation?:string|null; joining_date?:string|null; partner_type:string; region?:string|null; sponsor?:{agent_code:string}|null; users:{full_name:string;phone?:string|null;email?:string|null}; partner_personal_details?:{date_of_birth?:string|null;gender?:string|null;city?:string|null;state?:string|null;postal_code?:string|null;pan_number?:string|null;aadhaar_number?:string|null}|null };

export function PartnerForm({ partnerId }: { partnerId?: string }) {
  const router = useRouter();
  const editing = Boolean(partnerId);
  const [detail,setDetail]=useState<Detail|null>(null); const[loading,setLoading]=useState(editing); const[saving,setSaving]=useState(false); const[error,setError]=useState("");
  const [name,setName]=useState(""); const[mobile,setMobile]=useState(""); const[email,setEmail]=useState("");
  useEffect(()=>{if(!partnerId)return;let active=true;(async()=>{const response=await authorizedFetch(`/api/admin/partners/${partnerId}`);const body=await response.json();if(!active)return;if(!response.ok)setError(body.error);else{setDetail(body.data);setName(body.data.users.full_name);setMobile(body.data.users.phone||"");setEmail(body.data.users.email||"")}setLoading(false)})();return()=>{active=false}},[partnerId]);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError("");setSaving(true);const form=new FormData(event.currentTarget);const payload=Object.fromEntries(form.entries());payload.sendEmail=String(form.has("sendEmail"));payload.sendSms=String(form.has("sendSms"));const response=await authorizedFetch(editing?`/api/admin/partners/${partnerId}`:"/api/admin/partners",{method:editing?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const body=await response.json();setSaving(false);if(!response.ok)return setError(body.error||"Could not save partner");router.push("/admin/partners");router.refresh()}
  if(loading)return <div className="panel skeleton-wide"/>;
  const personal=detail?.partner_personal_details;
  return <div className="partner-editor-page">
    <div className="partner-editor-heading"><div><p>Partners / Agents</p><h1>{editing?"Modify Partner / Agent":"Create New Partner / Agent"}</h1><span>{editing?"Update partner information and access settings.":"Add a new partner or agent to your network."}</span></div><Link className="secondary-button" href="/admin/partners">← &nbsp; Back to Partners</Link></div>
    <form id="partner-editor-form" className="partner-editor-form" onSubmit={submit}>
      <div className="partner-editor-main">
        <section className="partner-form-section"><header><b>1</b><h2>Personal Information</h2></header><div className="partner-field-grid">
          <label>Full Name *<input name="fullName" required minLength={2} value={name} onChange={e=>setName(e.target.value)} placeholder="Enter full name"/></label>
          <label>Mobile Number *<div className="mobile-input"><span>+91</span><input name="mobile" required inputMode="tel" value={mobile.replace(/^\+91/,"")} onChange={e=>setMobile(e.target.value)} placeholder="Enter mobile number" disabled={editing}/></div></label>
          <label>Email Address<input name="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter email address" disabled={editing}/></label>
          <label>Date of Birth<input name="dateOfBirth" type="date" defaultValue={personal?.date_of_birth||""}/></label>
          <label>Gender<select name="gender" defaultValue={personal?.gender||""}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
          <label>PAN Number<input name="panNumber" maxLength={10} placeholder={editing?personal?.pan_number||"Enter new PAN to replace":"Enter PAN number"}/></label>
          <label>Aadhaar Number<input name="aadhaarNumber" inputMode="numeric" maxLength={12} placeholder={editing?personal?.aadhaar_number||"Enter new Aadhaar to replace":"Enter Aadhaar number"}/><small>Only the last 4 digits are stored.</small></label>
          <label>State<select name="state" defaultValue={personal?.state||detail?.region||""}><option value="">Select state</option>{STATES.map(state=><option key={state}>{state}</option>)}</select></label>
          <label>City<input name="city" defaultValue={personal?.city||""} placeholder="Enter city"/></label>
          <label>Area PIN Code<input name="postalCode" inputMode="numeric" maxLength={6} defaultValue={personal?.postal_code||""} placeholder="Enter 6-digit PIN code"/></label>
        </div></section>
        <section className="partner-form-section"><header><b>2</b><h2>Business Information</h2></header><div className="partner-field-grid">
          <label>Business / Agency Name<input name="agencyName" defaultValue={detail?.agency_name||""} placeholder="Enter agency name"/></label>
          <label>Agent Code (Auto)<input className="auto-field" value={detail?.agent_code||"AGT- Auto generated"} disabled/></label>
          <label>Joining Date *<input name="joiningDate" type="date" required defaultValue={detail?.joining_date||new Date().toISOString().slice(0,10)}/></label>
          <label>Upline Partner / Agent<input name="sponsorCode" defaultValue={detail?.sponsor?.agent_code||""} placeholder="Enter upline agent code" disabled={editing}/></label>
          <label>Partner Type<select name="partnerType" defaultValue={detail?.partner_type||"standard"}><option value="standard">Standard</option><option value="advisor">Advisor</option><option value="corporate">Corporate</option></select></label>
          <label>Designation<select name="designation" defaultValue={detail?.designation||"advisor"}><option value="advisor">Insurance Advisor</option><option value="senior_advisor">Senior Advisor</option><option value="agency_manager">Agency Manager</option><option value="corporate_partner">Corporate Partner</option></select></label>
          <label>Referral Code (Auto)<input className="auto-field" value={detail?`magik-${detail.agent_code.toLowerCase()}`:"magik- Auto generated"} disabled/></label>
        </div></section>
        <section className="partner-form-section"><header><b>3</b><h2>Login &amp; Access</h2></header><div className="delivery-options">
          <p>A secure profile-completion link is sent instead of a password. The partner verifies their email or mobile before access.</p>
          <label><input type="checkbox" name="sendSms" defaultChecked={!editing}/><span><strong>Send invitation by SMS</strong><small>Uses the configured SMS provider webhook.</small></span></label>
          <label><input type="checkbox" name="sendEmail" defaultChecked={!editing}/><span><strong>Send invitation by email</strong><small>Uses Firebase email-link delivery or your email webhook.</small></span></label>
        </div>{error&&<p className="form-error" role="alert">{error}</p>}</section>
      </div>
      <aside className="partner-preview-column"><section className="partner-preview-card"><h2>Partner Preview</h2><div className="preview-avatar"><Icon name="users"/></div><h3>{name||"Partner name"}</h3><dl><div><dt>Partner ID</dt><dd>{detail?.agent_code||"Auto generated"}</dd></div><div><dt>Agent Code</dt><dd>{detail?.agent_code||"AGT- Auto generated"}</dd></div><div><dt>Referral Code</dt><dd>{detail?`magik-${detail.agent_code.toLowerCase()}`:"magik- Auto generated"}</dd></div></dl></section>
      <section className="partner-notes-card"><h2>Important Notes</h2><p>✓ Secure link is sent by selected channels.</p><p>✓ Partner completes bank and ID verification.</p><p>✓ Admin approval is required before activation.</p><p>✓ Details can be edited from the partner list.</p></section></aside>
      <footer className="partner-editor-footer"><Link className="secondary-button" href="/admin/partners">Cancel</Link><button className="primary-button" disabled={saving}>{saving?"Saving…":editing?"Save Partner Changes":"Create Partner / Agent"}</button></footer>
    </form>
  </div>
}
