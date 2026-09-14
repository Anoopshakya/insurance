"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { accessToken } from "@/lib/supabase-client";
import { Icon } from "@/components/admin/icons";

const STATES = ["Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh","Chhattisgarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Lakshadweep","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

function displayDate(value?:string|null){if(!value)return "";const match=/^(\d{4})-(\d{2})-(\d{2})/.exec(value);return match?`${match[3]}/${match[2]}/${match[1]}`:value}
function isoDate(value:FormDataEntryValue|undefined){if(typeof value!=="string")return value;const match=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());return match?`${match[3]}-${match[2]}-${match[1]}`:value}

async function authorizedFetch(url: string, init: RequestInit = {}) {
  const token = await accessToken();
  return fetch(url, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` } });
}

type BankDetail = { account_holder?:string|null; bank_name?:string|null; branch_name?:string|null; account_type?:string|null; account_number?:string|null; ifsc?:string|null };
type Detail = { agent_code:string; agency_name?:string|null; designation?:string|null; joining_date?:string|null; partner_type:string; region?:string|null; sponsor?:{agent_code:string}|null; users:{full_name:string;phone?:string|null;email?:string|null}; partner_personal_details?:{date_of_birth?:string|null;gender?:string|null;address_line1?:string|null;city?:string|null;state?:string|null;postal_code?:string|null;pan_number?:string|null;aadhaar_number?:string|null}|null; agent_bank_details?:BankDetail[] };

export function PartnerForm({ partnerId }: { partnerId?: string }) {
  const router = useRouter();
  const editing = Boolean(partnerId);
  const [detail,setDetail]=useState<Detail|null>(null); const[loading,setLoading]=useState(editing); const[saving,setSaving]=useState(false); const[error,setError]=useState("");
  const [name,setName]=useState(""); const[mobile,setMobile]=useState(""); const[email,setEmail]=useState("");
  useEffect(()=>{if(!partnerId)return;let active=true;(async()=>{const response=await authorizedFetch(`/api/admin/partners/${partnerId}`);const body=await response.json();if(!active)return;if(!response.ok)setError(body.error);else{setDetail(body.data);setName(body.data.users.full_name);setMobile(body.data.users.phone||"");setEmail(body.data.users.email||"")}setLoading(false)})();return()=>{active=false}},[partnerId]);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError("");setSaving(true);const form=new FormData(event.currentTarget);const payload=Object.fromEntries(form.entries());payload.dateOfBirth=isoDate(payload.dateOfBirth)??"";payload.joiningDate=isoDate(payload.joiningDate)??"";payload.sendEmail=String(form.has("sendEmail"));payload.sendSms=String(form.has("sendSms"));const response=await authorizedFetch(editing?`/api/admin/partners/${partnerId}`:"/api/admin/partners",{method:editing?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const body=await response.json();setSaving(false);if(!response.ok)return setError(body.error||"Could not save partner");router.push("/admin/partners");router.refresh()}
  if(loading)return <div className="panel skeleton-wide"/>;
  const personal=detail?.partner_personal_details;
  const bank=detail?.agent_bank_details?.[0];
  return <div className="partner-editor-page">
    <div className="partner-editor-heading"><div><p>Partners / Agents</p><h1>{editing?"Modify Partner / Agent":"Create New Partner / Agent"}</h1><span>{editing?"Update partner information and access settings.":"Add a new partner or agent to your network."}</span></div><Link className="secondary-button" href="/admin/partners">← &nbsp; Back to Partners</Link></div>
    <form id="partner-editor-form" className="partner-editor-form" onSubmit={submit}>
      <div className="partner-editor-main">
        <section className="partner-form-section"><header><b>1</b><h2>Personal Information</h2></header><div className="partner-field-grid">
          <label>Full Name *<input name="fullName" required minLength={2} pattern="[A-Za-zÀ-ÖØ-öø-ÿ .'-]+" title="Enter letters only" value={name} onChange={e=>setName(e.target.value.replace(/[0-9]/g,""))} placeholder="Enter full name"/></label>
          <label>Mobile Number *<div className="mobile-input"><span>+91</span><input name="mobile" required inputMode="numeric" title="Enter exactly 10 digits" value={mobile.replace(/^\+91/,"")} onChange={e=>setMobile(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="Enter 10-digit mobile number" disabled={editing} maxLength={10} minLength={10} pattern="[0-9]{10}" onInput={event => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 10); }} /></div></label>
          <label>Email Address<input name="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter email address" disabled={editing}/></label>
          <label>Date of Birth<input name="dateOfBirth" type="date" max={new Date(new Date().setFullYear(new Date().getFullYear()-16)).toISOString().slice(0,10)} defaultValue={personal?.date_of_birth||""}/><small>Partner must be at least 16 years old.</small></label>
          <label>Gender<select name="gender" defaultValue={personal?.gender||""}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
          <label>PAN Number<input name="panNumber" maxLength={10} placeholder={editing?personal?.pan_number||"Enter new PAN to replace":"Enter PAN number"}/></label>
          <label>Aadhaar Number<input name="aadhaarNumber" inputMode="numeric" pattern="[0-9]{12}" maxLength={12} title="Enter exactly 12 digits" onInput={e=>{e.currentTarget.value=e.currentTarget.value.replace(/\D/g,"").slice(0,12)}} placeholder={editing?personal?.aadhaar_number||"Enter new Aadhaar to replace":"Enter 12-digit Aadhaar number"}/></label>
          <label className="wide-field">Address Line 1<input name="addressLine1" defaultValue={personal?.address_line1||""} maxLength={250} placeholder="House / flat number, building and street"/></label>
          <label>State<select name="state" defaultValue={personal?.state||detail?.region||""}><option value="">Select state</option>{STATES.map(state=><option key={state}>{state}</option>)}</select></label>
          <label>City<input name="city" defaultValue={personal?.city||""} placeholder="Enter city"/></label>
          <label>Area PIN Code<input name="postalCode" inputMode="numeric" maxLength={6} defaultValue={personal?.postal_code||""} placeholder="Enter 6-digit PIN code"/></label>
        </div></section>
        <section className="partner-form-section"><header><b>2</b><h2>Business Information</h2></header><div className="partner-field-grid">
          <label>Business / Agency Name (Optional)<input name="agencyName" defaultValue={detail?.agency_name||""} placeholder="Enter agency name"/></label>
          <label>Agent Code (Auto)<input className="auto-field" value={detail?.agent_code||"AGT- Auto generated"} disabled/></label>
          <label>Joining Date *<input name="joiningDate" type="date" required defaultValue={detail?.joining_date||new Date().toISOString().slice(0,10)}/></label>
          <label>Upline Partner / Agent (Optional)<input name="sponsorCode" defaultValue={detail?.sponsor?.agent_code||""} placeholder="Enter upline agent code" disabled={editing}/></label>
          <label>Partner Type<select name="partnerType" defaultValue={detail?.partner_type||"standard"}><option value="standard">Standard</option><option value="advisor">Advisor</option><option value="corporate">Corporate</option></select></label>
          <label>Designation<select name="designation" defaultValue={detail?.designation||"advisor"}><option value="advisor">Insurance Advisor</option><option value="senior_advisor">Senior Advisor</option><option value="agency_manager">Agency Manager</option><option value="corporate_partner">Corporate Partner</option></select></label>
          <label>Referral Code (Auto)<input className="auto-field" value={detail?`magik-${detail.agent_code.toLowerCase()}`:"magik- Auto generated"} disabled/></label>
        </div></section>
        <section className="partner-form-section"><header><b>3</b><h2>Bank Account Details</h2></header><div className="partner-field-grid">
          <label>Account Holder Name<input name="accountHolder" defaultValue={bank?.account_holder||""} placeholder="Name as per bank records"/></label>
          <label>Bank Name<input name="bankName" defaultValue={bank?.bank_name||""} placeholder="Enter bank name"/></label>
          <label>Branch Name<input name="branchName" defaultValue={bank?.branch_name||""} placeholder="Enter branch name"/></label>
          <label>Account Type<select name="accountType" defaultValue={bank?.account_type||""}><option value="">Select account type</option><option value="savings">Savings</option><option value="current">Current</option></select></label>
          <label>Account Number<input name="accountNumber" inputMode="numeric" autoComplete="off" defaultValue={bank?.account_number||""} placeholder="Enter account number"/></label>
          <label>Confirm Account Number<input name="confirmAccountNumber" inputMode="numeric" autoComplete="off" defaultValue={bank?.account_number||""} placeholder="Re-enter account number"/></label>
          <label>IFSC Code<input name="ifsc" maxLength={11} defaultValue={bank?.ifsc||""} placeholder="e.g. HDFC0001234"/></label>
        </div><p className="bank-step-note">Bank details are optional while creating an invitation. If any bank field is entered, all required bank fields must be completed.</p></section>
        <section className="partner-form-section"><header><b>4</b><h2>Login &amp; Access</h2></header><div className="delivery-options">
          <p>A secure profile-completion link is sent instead of a password. The partner verifies their email or mobile before access.</p>
          <label><input type="checkbox" name="sendSms" defaultChecked={!editing}/><span><strong>Send invitation by SMS</strong><small>Uses the configured SMS provider webhook.</small></span></label>
          <label><input type="checkbox" name="sendEmail" defaultChecked={!editing}/><span><strong>Send invitation by email</strong><small>Uses Supabase email-link delivery or your email webhook.</small></span></label>
        </div>{error&&<p className="form-error" role="alert">{error}</p>}</section>
      </div>
      <aside className="partner-preview-column"><section className="partner-preview-card"><h2>Partner Preview</h2><div className="preview-avatar"><Icon name="users"/></div><h3>{name||"Partner name"}</h3><dl><div><dt>Partner ID</dt><dd>{detail?.agent_code||"Auto generated"}</dd></div><div><dt>Agent Code</dt><dd>{detail?.agent_code||"AGT- Auto generated"}</dd></div><div><dt>Referral Code</dt><dd>{detail?`magik-${detail.agent_code.toLowerCase()}`:"magik- Auto generated"}</dd></div></dl></section>
      <section className="partner-notes-card"><h2>Important Notes</h2><p>✓ Secure link is sent by selected channels.</p><p>✓ Partner completes bank and ID verification.</p><p>✓ Admin approval is required before activation.</p><p>✓ Details can be edited from the partner list.</p></section></aside>
      <footer className="partner-editor-footer"><Link className="secondary-button" href="/admin/partners">Cancel</Link><button className="primary-button" disabled={saving}>{saving?"Saving…":editing?"Save Partner Changes":"Create Partner / Agent"}</button></footer>
    </form>
  </div>
}
