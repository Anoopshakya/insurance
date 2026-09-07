"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase-client";

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
  status: string;
  product_type?: string;
  selections?: Record<string, string> | null;
  agent?: Agent | null;
  created_at: string;
};

async function api(url: string, init: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
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
  const [rows, setRows] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"all" | "website" | "internal">("all");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await api("/api/admin/leads");
    const body = await response.json();
    if (response.ok) {
      setRows(body.data);
      setAgents(body.agents);
      setError("");
    } else setError(body.error || "Unable to load leads");
    setLoading(false);
  }, []);
  useEffect(() => {
    const timer = setTimeout(load, 250);
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
        (tab === "all" || row.leadType === tab) &&
        (!term || `${row.name} ${row.contact} ${row.product_type ?? ""}`.toLowerCase().includes(term)),
    );
  }, [rows, tab, query]);

  async function changeStatus(lead: Lead, status: string) {
    const response = await api("/api/admin/leads", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: lead.id, leadType: lead.leadType, status }),
    });
    const body = await response.json();
    if (!response.ok) return setError(body.error);
    if (status === "converted" && body.conversion) {
      sessionStorage.setItem("policyLeadConversion", JSON.stringify(body.conversion));
      location.href = "/admin/policies?convert=1";
      return;
    }
    await load();
  }
  async function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await api("/api/admin/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) return setError(body.error || "Could not create lead");
    setCreateOpen(false);
    await load();
  }

  return (
    <div className="partner-directory leads-directory">
      <header className="directory-heading">
        <div>
          <h1>Leads</h1>
          <p>Follow up website enquiries and leads created by your team.</p>
        </div>
        <div><button className="primary-button" onClick={() => setCreateOpen(true)}>＋ Create Lead</button></div>
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
          <div className="directory-search lead-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, mobile or product…" /></div>
        </div>
        <div className="directory-table-wrap">
          <table className="directory-table lead-table">
            <thead><tr><th>Lead</th><th>Type</th><th>Requirement</th><th>Assigned to</th><th>Created</th><th>Status / Follow-up</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6}>Loading leads…</td></tr> : visible.length === 0 ? <tr><td colSpan={6}>No leads found.</td></tr> : visible.map((lead) => (
                <tr key={`${lead.leadType}-${lead.id}`}>
                  <td><div className="directory-person"><span>{lead.name.slice(0, 2).toUpperCase()}</span><div><strong>{lead.name}</strong><small>☎ {lead.contact || "—"}</small></div></div></td>
                  <td><span className={`lead-source ${lead.leadType}`}>{lead.leadType === "website" ? "Website" : "Team created"}</span></td>
                  <td><strong className="lead-product">{lead.product_type?.replace("term", "Term Life") || "General enquiry"}</strong>{lead.selections && <small className="lead-options">{Object.values(lead.selections).join(" · ")}</small>}</td>
                  <td>{agentName(lead.agent)}</td>
                  <td>{new Date(lead.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td><select className={`lead-status ${lead.status}`} value={lead.status} onChange={(event) => changeStatus(lead, event.target.value)}>
                    <option value="new">New</option><option value="contacted">Contacted</option>
                    {lead.leadType === "internal" && <><option value="qualified">Qualified</option><option value="proposal">Proposal</option></>}
                    <option value="converted">Converted</option><option value={lead.leadType === "website" ? "closed" : "lost"}>{lead.leadType === "website" ? "Closed" : "Lost"}</option>
                  </select></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="directory-footer"><span>Showing {visible.length} of {rows.length} leads</span></footer>
      </section>
      {createOpen && <div className="directory-modal" onMouseDown={() => setCreateOpen(false)}><section onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={() => setCreateOpen(false)}>×</button><h2>Create Lead</h2><p>Create an internal lead and assign it to a partner or agent for follow-up.</p>
        <form className="lead-create-form" onSubmit={createLead}>
          <label>Customer name<input name="name" required minLength={2} /></label>
          <label>Mobile number<input name="contact" required inputMode="tel" minLength={10} /></label>
          <label>Assign partner / agent<select name="agentId" required defaultValue=""><option value="" disabled>Select partner / agent</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agentName(agent)}</option>)}</select></label>
          <label>Priority<select name="priority" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          <div className="modal-buttons"><button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Creating…" : "Create Lead"}</button></div>
        </form>
      </section></div>}
    </div>
  );
}
