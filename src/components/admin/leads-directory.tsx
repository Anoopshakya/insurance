"use client";
import {LeadFilters,useLeadFilters,matchesLeadFilters} from "@/components/lead-filters";
import {LeadActivity,LeadStatusControl,NextFollowup} from "@/components/lead-activity";
import {LeadCustomerFields} from "@/components/lead-customer-fields";
import {RecordActions} from "@/components/admin/record-actions";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { products } from "@/components/website/website-products";
import { accessToken } from "@/lib/supabase-client";

type Agent = {
  id: string;
  agent_code: string;
  users: { full_name: string } | Array<{ full_name: string }>;
};
type Lead = {
  id: string;
  leadType: "website" | "internal";
  name: string;
  contact: string | null;
  source: string | null;
  priority?: string;
  customer_id?:string;
  agent_id?:string;
  product_sector_id?:string;
  product_type_id?:string;
  purchase_timeline?:string;
  status: string;
  product_type?: string;
  selections?: Record<string, string> | null;
  agent?: Agent | null;
  followups?:any[];
  created_at: string;
};

async function api(url: string, init: RequestInit = {}) {
  const token = await accessToken();
  return fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
  });
}
function agentName(agent?: Agent | null) {
  if (!agent) return "Unassigned";
  const user = Array.isArray(agent.users) ? agent.users[0] : agent.users;
  return `${user?.full_name ?? "Partner"} · ${agent.agent_code}`;
}

export function LeadsDirectory() {
  const [filters,setFilters]=useLeadFilters();
  const [currentUserId,setCurrentUserId]=useState("");
  const [rows, setRows] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"all" | "website" | "internal">("all");
  const [query, setQuery] = useState("");
  const [editing,setEditing]=useState<Lead|null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [sectors,setSectors]=useState<{id:string;name:string}[]>([]);
  const [productTypes,setProductTypes]=useState<{id:string;name:string;category_id:string}[]>([]);
  const [selectedSector,setSelectedSector]=useState("");
  const [createError,setCreateError]=useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
    const response = await api("/api/admin/leads");
    const body = await response.json();
    if (response.ok) {
      setRows(body.data);
      setCurrentUserId(body.currentUserId||"");
      setAgents(body.agents);
      setSectors(body.sectors||[]);
      setProductTypes(body.productTypes||[]);
      setError("");
    } else setError(body.error || "Unable to load leads");
    }catch(e){setError(e instanceof Error?e.message:"Unable to load leads")}finally{setLoading(false)}
  }, []);
  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      website: rows.filter((row) => row.leadType === "website").length,
      internal: rows.filter((row) => row.leadType === "internal").length,
      new: rows.filter((row) => row.status === "new").length,
    }),
    [rows],
  );
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter(
      (row) =>
        matchesLeadFilters(row,filters,currentUserId) && (tab === "all" || row.leadType === tab) &&
        (!term || `${row.name} ${row.contact} ${row.product_type ?? ""}`.toLowerCase().includes(term)),
    );
  }, [rows, tab, query,filters,currentUserId]);

  async function changeStatus(lead: Lead, status: string,lostReason?:string,lostNote?:string) {
    const response = await api("/api/admin/leads", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: lead.id, leadType: lead.leadType, status,lostReason,lostNote }),
    });
    const body = await response.json();
    if (!response.ok) throw Error(body.error);
    if (status === "converted" && body.conversion) {
      sessionStorage.setItem("policyLeadConversion", JSON.stringify(body.conversion));
      location.href = "/admin/policies?convert=1";
      return;
    }
    await load();
  }
  async function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(saving)return;
    setSaving(true);
    setCreateError("");
    try {
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await api("/api/admin/leads", {
      method: editing ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({...payload,...(editing?{id:editing.id}:{})}),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not create lead");
    setCreateOpen(false);
    await load();
    } catch(e){setCreateError(e instanceof Error?e.message:"Could not create lead");} finally {setSaving(false);}
  }

  return (
    <div className="partner-directory leads-directory">
      <header className="directory-heading">
        <div>
          <h1>Leads</h1>
          <p>Follow up website enquiries and leads created by your team.</p>
        </div>
        <div><button className="primary-button" onClick={() => {setEditing(null);setSelectedSector("");setCreateError("");setCreateOpen(true)}}>＋ Create Lead</button></div>
      </header>
      {error && <p className="form-error">{error}</p>}
      <section className="lead-stat-grid">
        <article><span>All leads</span><strong>{counts.all}</strong></article>
        <article><span>Website leads</span><strong>{counts.website}</strong></article>
        <article><span>Partner / admin leads</span><strong>{counts.internal}</strong></article>
        <article><span>Awaiting follow-up</span><strong>{counts.new}</strong></article>
      </section>
      <section className="directory-card">
        <div className="directory-toolbar">
          <div className="directory-tabs">
            {(["all", "website", "internal"] as const).map((item) => (
              <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>
                {item === "all" ? "All Leads" : item === "website" ? "Website Leads" : "Partner / Admin Leads"} ({counts[item]})
              </button>
            ))}
          </div>
          <div className="directory-search lead-search"><input className="mp-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, mobile or product…" /></div>
        </div>
        <LeadFilters rows={rows} value={filters} onChange={setFilters} agents={agents} products={[...productTypes,...products.map(p=>({id:p.type,name:p.name}))]} currentUserId={currentUserId}/>
        <div className="directory-table-wrap">
          <table className="directory-table lead-table">
            <thead><tr><th>Lead</th><th>Type</th><th>Requirement</th><th>Assigned to</th><th>Created</th><th>Lead Status</th><th>Next Follow-up</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8}>Loading leads…</td></tr> : visible.length === 0 ? <tr><td colSpan={8}>No leads found.</td></tr> : visible.map((lead) => (
                <tr key={`${lead.leadType}-${lead.id}`}>
                  <td><div className="directory-person"><span>{lead.name.slice(0, 2).toUpperCase()}</span><div><strong>{lead.name}</strong><small>☎ {lead.contact || "—"}</small></div></div></td>
                  <td><span className={`lead-source ${lead.leadType}`}>{lead.leadType === "website" ? "Website" : "Team created"}</span></td>
                  <td><strong className="lead-product">{products.find(product => product.type === lead.product_type)?.name || productTypes.find(p=>p.id===lead.product_type_id)?.name || lead.product_type || "General enquiry"}</strong>{lead.selections && <small className="lead-options">{Object.values(lead.selections).join(" · ")}</small>}</td>
                  <td>{agentName(lead.agent)}</td>
                  <td>{new Date(lead.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td><LeadStatusControl value={lead.status} onChange={(status,reason,note)=>changeStatus(lead,status,reason,note)}/></td><td><NextFollowup lead={lead}/></td><td><LeadActivity id={lead.id} kind={lead.leadType} scope="admin" name={lead.name} onChanged={load}/>
                  <RecordActions module={lead.leadType==='website'?'website-leads':'leads'} row={{...lead,customer_name:lead.name,mobile:lead.contact}} onChanged={load} onEdit={lead.leadType==='internal'?()=>{setEditing(lead);setSelectedSector(lead.product_sector_id||'');setCreateError('');setCreateOpen(true)}:undefined}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="directory-footer"><span>Showing {visible.length} of {rows.length} leads</span></footer>
      </section>
      {createOpen && <div className="directory-modal lead-create-modal" onMouseDown={() => setCreateOpen(false)}><section onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={() => setCreateOpen(false)}>×</button><h2>{editing?"Edit Lead":"Create Lead"}</h2><p>Create an internal lead and assign it to a partner or agent for follow-up.</p>
        <form className="lead-create-form" onSubmit={createLead}>
          <LeadCustomerFields scope="admin" initial={editing?{id:editing.customer_id,name:editing.name,contact:editing.contact}:undefined} onSelect={row=>{const select=document.querySelector<HTMLSelectElement>('.lead-create-form select[name="agentId"]');if(select&&row.agent_id)select.value=row.agent_id}}/>
          <label className="mp-label">Assign partner / agent<select className="mp-control" name="agentId" required defaultValue={editing?.agent_id||""}><option value="" disabled>Select partner / agent</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agentName(agent)}</option>)}</select></label>
          <label className="mp-label">Priority<select className="mp-control" name="priority" defaultValue={editing?.priority||"medium"}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          <label className="mp-label">Product sector<select className="mp-control" name="productSectorId" required value={selectedSector} onChange={e=>setSelectedSector(e.target.value)}><option value="" disabled>Select product sector</option>{sectors.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="mp-label">Product type<select className="mp-control" name="productTypeId" key={selectedSector} required defaultValue={selectedSector===editing?.product_sector_id?editing.product_type_id||"":""} disabled={!selectedSector}><option value="" disabled>Select product type</option>{productTypes.filter(t=>t.category_id===selectedSector).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <label className="mp-label">When are they planning to buy?<select className="mp-control" name="purchaseTimeline" required defaultValue={editing?.purchase_timeline||""}><option value="" disabled>Select purchase timeline</option><option value="immediately">Immediately</option><option value="within_7_days">Within 7 days</option><option value="within_30_days">Within 30 days</option><option value="within_3_months">Within 3 months</option><option value="researching">Just researching</option></select></label>
          {createError&&<p role="alert" className="mp-form-error">{createError}</p>}
          <div className="modal-buttons"><button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Creating…" : "Create Lead"}</button></div>
        </form>
      </section></div>}
    </div>
  );
}
