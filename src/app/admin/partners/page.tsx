"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase-client";
import { Icon } from "@/components/admin/icons";

type Partner = { id: string; agent_code: string; partner_type: string; region: string | null; status: string; kyc_status: string; created_at: string; users: { full_name: string; phone: string; email: string | null } };
type BulkResult = { total: number; created: number; failed: number; rows: Array<{ row: number; name: string; mobile: string; status: string; agentCode?: string; error?: string }> };

async function authorizedFetch(url: string, init: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  return fetch(url, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` } });
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]); const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "add" | "bulk">("list");
  const load = useCallback(async () => { setLoading(true); const response = await authorizedFetch("/api/admin/partners"); if (response.ok) setPartners((await response.json()).data); setLoading(false); }, []);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  return <div className="dashboard-page partner-admin-page">
    <div className="page-heading"><div><p className="admin-eyebrow">Distribution network</p><h1>Partners</h1><p>Create accounts, import teams, and track onboarding status.</p></div><div className="partner-actions"><button className="secondary-button" onClick={() => setMode("bulk")}>Bulk upload</button><button className="primary-button" onClick={() => setMode("add")}>+ Add partner</button></div></div>
    <div className="partner-tabs" role="tablist"><button className={mode === "list" ? "active" : ""} onClick={() => setMode("list")}>All partners</button><button className={mode === "add" ? "active" : ""} onClick={() => setMode("add")}>Add partner</button><button className={mode === "bulk" ? "active" : ""} onClick={() => setMode("bulk")}>Excel import</button></div>
    {mode === "list" && <PartnerList partners={partners} loading={loading} onAdd={() => setMode("add")} />}
    {mode === "add" && <AddPartner onCreated={() => { load(); setMode("list"); }} />}
    {mode === "bulk" && <BulkPartners onComplete={load} />}
  </div>;
}

function AddPartner({ onCreated }: { onCreated: () => void }) {
  const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); setSuccess(""); setLoading(true); const form = new FormData(event.currentTarget); const payload = Object.fromEntries(form.entries()); const response = await authorizedFetch("/api/admin/partners", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json(); setLoading(false); if (!response.ok) return setError(result.error); setSuccess(`Partner ${result.data.agent_code} invited. Delivery: ${result.data.delivery.map((item: {channel:string;status:string}) => `${item.channel} ${item.status}`).join(", ") || "link ready to copy"}.`); event.currentTarget.reset(); setTimeout(onCreated, 1800); }
  return <section className="panel partner-form-panel"><div className="panel-heading"><div><p className="admin-eyebrow">Single invitation</p><h2>Invite a partner</h2></div></div><form className="partner-form" onSubmit={submit}><label>Full name *<input name="fullName" required minLength={2} placeholder="Enter partner name" /></label><label>Mobile number<input name="mobile" inputMode="tel" placeholder="98765 43210" /><small>Email or mobile is required.</small></label><label>Email address<input name="email" type="email" placeholder="partner@example.com" /></label><label>Region<input name="region" placeholder="e.g. Mumbai" /></label><label>Partner type<select name="partnerType" defaultValue="standard"><option value="standard">Standard</option><option value="advisor">Advisor</option><option value="corporate">Corporate</option></select></label><label>Sponsor code<input name="sponsorCode" placeholder="Optional partner code" /></label><div className="credential-notice"><Icon name="shield"/><span><strong>Verified onboarding</strong><small>We send a registration link. The partner verifies their email or mobile, completes bank and identity details, then waits for admin approval.</small></span></div>{error && <p className="form-error" role="alert">{error}</p>}{success && <p className="form-success" role="status">{success}</p>}<button className="primary-button partner-submit" disabled={loading}>{loading ? "Creating invitation…" : "Invite partner"}</button></form></section>;
}

function BulkPartners({ onComplete }: { onComplete: () => void }) {
  const [file, setFile] = useState<File | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [result, setResult] = useState<BulkResult | null>(null);
  async function template() { const response = await authorizedFetch("/api/admin/partners/template"); if (!response.ok) return setError("Template download failed"); const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "magikpolicy-partners-template.xlsx"; anchor.click(); URL.revokeObjectURL(url); }
  async function upload() { if (!file) return setError("Select an Excel file first"); setLoading(true); setError(""); setResult(null); const form = new FormData(); form.append("file", file); const response = await authorizedFetch("/api/admin/partners/bulk", { method: "POST", body: form }); const body = await response.json(); setLoading(false); if (!response.ok) return setError(body.error); setResult(body.data); onComplete(); }
  return <section className="panel bulk-panel"><div className="panel-heading"><div><p className="admin-eyebrow">Bulk onboarding</p><h2>Import partners from Excel</h2></div><button className="secondary-button" onClick={template}>Download template</button></div><div className="bulk-content"><div className="upload-zone"><span><Icon name="users"/></span><h3>Choose your completed workbook</h3><p>.xlsx or .xlsm · Maximum 500 partners · 5 MB</p><label className="secondary-button">Select Excel file<input type="file" accept=".xlsx,.xlsm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>{file && <strong>{file.name}</strong>}</div><ol className="import-guide"><li>Download the MagikPolicy template.</li><li>Keep the Name and Mobile columns filled.</li><li>Upload and review row-level results.</li></ol>{error && <p className="form-error">{error}</p>}<button className="primary-button" onClick={upload} disabled={!file || loading}>{loading ? "Creating partner accounts…" : "Upload & create partners"}</button>{result && <div className="import-result"><div><strong>{result.created}</strong><span>Created</span></div><div><strong>{result.failed}</strong><span>Failed</span></div><div><strong>{result.total}</strong><span>Total rows</span></div>{result.rows.filter((row) => row.status === "failed").map((row) => <p key={row.row}>Row {row.row} · {row.name || row.mobile}: {row.error}</p>)}</div>}</div></section>;
}

function PartnerList({ partners, loading, onAdd }: { partners: Partner[]; loading: boolean; onAdd: () => void }) {
  if (loading) return <div className="panel skeleton-wide"/>;
  if (!partners.length) return <div className="panel dashboard-state"><span><Icon name="partners"/></span><h2>No partners yet</h2><p>Create your first partner or import a team from Excel.</p><button className="primary-button" onClick={onAdd}>Add first partner</button></div>;
  async function approve(id:string){const response=await authorizedFetch(`/api/admin/partners/${id}/approve`,{method:"POST"});if(!response.ok)return alert((await response.json()).error);location.reload()}
  return <section className="panel"><div className="panel-heading"><div><p className="admin-eyebrow">Partner directory</p><h2>{partners.length} partners</h2></div></div><div className="partner-list">{partners.map((partner) => <article className="partner-row" key={partner.id}><span className="partner-initial">{partner.users.full_name.slice(0,2).toUpperCase()}</span><div><strong>{partner.users.full_name}</strong><small>{partner.users.phone || partner.users.email} · {partner.agent_code}</small></div><div><span>Region</span><strong>{partner.region || "—"}</strong></div><div><span>KYC</span><strong>{partner.kyc_status.replaceAll("_", " ")}</strong></div>{partner.status==="under_review"?<button className="approve-button" onClick={()=>approve(partner.id)}>Approve</button>:<span className={`status-pill ${partner.status}`}>{partner.status.replaceAll("_"," ")}</span>}</article>)}</div></section>;
}
