"use client";
import {LeadForm} from "@/components/partner/lead-form";
import {LeadPolicyForm} from "@/components/partner/lead-policy-form";
import "@/app/partner/partner-policies.css";
import { PartnerLeadsEmpty } from "@/components/partner/partner-leads-empty";
import { PartnerSkeleton } from "@/components/partner/partner-skeleton";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  Clock3,
  Download,
  MessageCircle,
  MoreVertical,
  Phone,
  PieChart,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { supabaseAuth } from "@/lib/supabase-client";
type Lead = {
  id: string;
  policy?:Array<{id:string}>;
  name: string;
  contact: string | null;
  source: string | null;
  priority: string;
  status: string;
  created_at: string;
  product_sector_id: string | null;
  product_type_id: string | null;
  purchase_timeline: string | null;
  product_sector?: { name: string } | Array<{ name: string }> | null;
  product_type?: { name: string } | Array<{ name: string }> | null;
};
type Sector = { id: string; name: string };
type ProductType = { id: string; category_id: string; name: string };
const statuses = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "converted",
  "lost",
];
const title = (v: string) =>
  v.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
async function api(init: RequestInit = {}) {
  const { data } = await supabaseAuth.auth.getSession();
  return fetch("/api/partner/leads", {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${data.session?.access_token || ""}`,
    },
  });
}
export function PartnerLeadsContent() {
  const [editing,setEditing]=useState<Lead|null>(null),[policyLead,setPolicyLead]=useState<Lead|null>(null),[menu,setMenu]=useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Lead[]>([]),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [open, setOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [sectors, setSectors] = useState<Sector[]>([]),
    [productTypes, setProductTypes] = useState<ProductType[]>([]),
    [selectedSector, setSelectedSector] = useState(""),
    [activeLead, setActiveLead] = useState<Lead | null>(null),
    [error, setError] = useState("");
  const load = useCallback(async () => {setLoading(true);setError("");try {
    const r = await api(),
      b = await r.json();
    if (r.ok) {
      setRows(b.data || []);
      setSectors(b.sectors || []);
      setProductTypes(b.productTypes || []);
    } else setError(b.error || "Unable to load leads.");
  } catch { setError("Unable to load leads. Please refresh and try again."); } finally { setLoading(false); }}, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => { if (new URLSearchParams(window.location.search).get("create") === "1") { setOpen(true); const url=new URL(window.location.href); url.searchParams.delete("create"); window.history.replaceState(window.history.state,"",url.pathname+url.search+url.hash); } }, []);
  const visible = useMemo(
    () =>
      rows.filter(
        (r) =>
          (status === "all" || r.status === status) &&
          `${r.name} ${r.contact || ""} ${r.source || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [rows, query, status],
  );
  const summary = [
    ["Total Leads", rows.length, "12%", Users, "violet"],
    [
      "New Leads",
      rows.filter((r) => r.status === "new").length,
      "18%",
      Clock3,
      "blue",
    ],
    [
      "In Progress",
      rows.filter((r) => !["new", "converted", "lost"].includes(r.status))
        .length,
      "8%",
      BarChart3,
      "orange",
    ],
    [
      "Converted",
      rows.filter((r) => r.status === "converted").length,
      "20%",
      CircleCheck,
      "green",
    ],
  ] as const;
  async function update(id: string, next: string) {
    const lead=rows.find(row=>row.id===id);
    if(next==="converted"&&lead&&!lead.policy?.length){setActiveLead(null);setPolicyLead(lead);return;}
    const r = await api({
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    if (!r.ok)
      return setError((await r.json()).error || "Could not update lead.");
    await load();
  }
  const relatedName = (value: Lead["product_type"] | Lead["product_sector"]) =>
    Array.isArray(value) ? value[0]?.name : value?.name;
  const whatsappNumber = (contact: string | null) => {
    const digits = (contact || "").replace(/\D/g, "");
    return digits.length === 10 ? `91${digits}` : digits;
  };
  if (loading) return <PartnerSkeleton view="leads" />;
  return (
    <div className="pl-page">
      <div className="pl-heading">
        <div>
          <h1>Leads</h1>
          <p>
            Manage your leads, track follow-ups and convert them into customers.
          </p>
        </div>
        <button onClick={() => setOpen(true)}>
          <Plus /> Add Lead
        </button>
      </div>
      {rows.length===0 ? (error ? <section className="pd-card" role="alert"><p>{error}</p><button type="button" onClick={()=>void load()}>Try again</button></section> : <PartnerLeadsEmpty onAdd={()=>setOpen(true)}/>) : <>
      <section className="pl-stats">
        {summary.map(([label, value, growth, Icon, tone]) => (
          <article key={label}>
            <i className={tone}>
              <Icon />
            </i>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <b>↑ {growth}</b>
              <small>vs last month</small>
            </div>
          </article>
        ))}
      </section>
      <section className="pl-filters">
        <label className="mp-label">
          <Search />
          <input className="mp-control"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, mobile number, product..."
          />
        </label>
        <select className="mp-control">
          <option>All Products</option>
        </select>
        <select className="mp-control" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All Status</option>
          {statuses.map((s) => (
            <option value={s} key={s}>
              {title(s)}
            </option>
          ))}
        </select>
        <select className="pl-assigned-filter mp-control">
          <option>My Leads</option>
        </select>
        <button className="pl-date">
          <CalendarDays /> Select Date
        </button>
        <button
          className="pl-reset"
          onClick={() => {
            setQuery("");
            setStatus("all");
          }}
        >
          Reset
        </button>
        <button className="pl-apply">Apply</button>
        <button className="pl-filter-mobile">
          <PieChart />
        </button>
      </section>
      {error && <p className="partner-error">{error}</p>}
      <section className="pl-list">
        <div className="pl-list-title">
          <h2>Leads ({rows.length})</h2>
          <button>
            <Download /> Export <ChevronDown />
          </button>
        </div>
        <div className="pl-table">
          <div className="pl-table-head live">
            <span>#</span>
            <span>Name</span>
            <span>Mobile Number</span>
            <span>Product Interest</span>
            <span>Lead Source</span>
            <span>Status</span>
            <span>Created On</span>
            <span>Priority</span>
            <span>Actions</span>
          </div>
          {visible.length===0&&<div className="pl-no-matches" role="status"><h3>No matching leads</h3><p>Try another search or clear your filters.</p><button type="button" onClick={()=>{setQuery("");setStatus("all");}}>Clear filters</button></div>}
          {visible.map((row, index) => (
            <div
              className="pl-row live"
              key={row.id}
              onClick={() => {
                if (window.matchMedia("(max-width: 760px)").matches)
                  setActiveLead(row);
              }}
            >
              <span className="pl-number">{index + 1}</span>
              <span className="pl-person">
                <i>
                  {row.name
                    .split(" ")
                    .map((v) => v[0])
                    .slice(0, 2)
                    .join("")}
                </i>
                <b>{row.name}</b>
                <small>{row.contact || "—"}</small>
              </span>
              <span className="pl-mobile">{row.contact || "—"}</span>
              <span>
                <em className="pl-tag product">
                  {relatedName(row.product_type) || "General"}
                </em>
              </span>
              <span className="pl-source">
                <em className="pl-tag source">
                  {title(row.source || "Partner")}
                </em>
              </span>
              <span>
                <select
                  className={(`pl-status ${row.status}`) + " mp-control"}
                  value={row.status}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(e) => update(row.id, e.target.value)}
                >
                  {statuses.map((s) => (
                    <option value={s} key={s}>
                      {title(s)}
                    </option>
                  ))}
                </select>
              </span>
              <span className="pl-assigned-date">
                {new Date(row.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="pl-priority">{title(row.priority)}</span>
              <span className="pl-actions">
                <Phone />
                <MessageCircle />
                <button aria-label={`More actions for ${row.name}`} aria-expanded={menu===row.id} onClick={e=>{e.stopPropagation();setMenu(menu===row.id?null:row.id)}}><MoreVertical /></button>
                {menu===row.id&&<span className="pl-action-menu" onClick={e=>e.stopPropagation()}><button onClick={()=>{setEditing(row);setOpen(true);setMenu(null)}}>Edit lead</button><button onClick={async()=>{setMenu(null);if(!window.confirm(`Delete lead for ${row.name}?`))return;try{const r=await api({method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({id:row.id})});if(!r.ok)throw Error((await r.json()).error);await load()}catch(e){setError(e instanceof Error?e.message:"Unable to delete lead")}}}>Delete lead</button></span>}
              </span>
            </div>
          ))}
        </div>
        <footer>
          <span>
            Showing {visible.length} of {rows.length} leads
          </span>
        </footer>
      </section>
      </>}
      {open&&<LeadForm lead={editing} close={()=>{setOpen(false);setEditing(null)}} saved={()=>{setOpen(false);setEditing(null);void load()}}/>}
      {policyLead&&<LeadPolicyForm lead={policyLead} close={()=>setPolicyLead(null)} saved={()=>{setPolicyLead(null);void load()}}/>}
      {activeLead && (
        <div className="pl-lead-modal" onMouseDown={() => setActiveLead(null)}>
          <section onMouseDown={(event) => event.stopPropagation()}>
            <button
              className="pl-modal-close"
              onClick={() => setActiveLead(null)}
            >
              ×
            </button>
            <div className="pl-lead-modal-person">
              <i>
                {activeLead.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </i>
              <div>
                <h2>{activeLead.name}</h2>
                <p>{activeLead.contact || "No mobile number"}</p>
              </div>
            </div>
            <dl>
              <div>
                <dt>Product sector</dt>
                <dd>
                  {relatedName(activeLead.product_sector) || "Not selected"}
                </dd>
              </div>
              <div>
                <dt>Product type</dt>
                <dd>{relatedName(activeLead.product_type) || "General"}</dd>
              </div>
              <div>
                <dt>Planning to buy</dt>
                <dd>
                  {activeLead.purchase_timeline
                    ? title(activeLead.purchase_timeline)
                    : "Not specified"}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{title(activeLead.status)}</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>{title(activeLead.priority)}</dd>
              </div>
              <div>
                <dt>Lead source</dt>
                <dd>{title(activeLead.source || "Partner")}</dd>
              </div>
              <div>
                <dt>Created on</dt>
                <dd>
                  {new Date(activeLead.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
            <div className="pl-contact-actions">
              {activeLead.contact ? (
                <a href={`tel:${activeLead.contact}`}>
                  <Phone /> Call
                </a>
              ) : (
                <span>
                  <Phone /> Call
                </span>
              )}
              {activeLead.contact ? (
                <a
                  href={`https://wa.me/${whatsappNumber(activeLead.contact)}?text=${encodeURIComponent(`Hello ${activeLead.name}, this is regarding your insurance enquiry with MagikPolicy.`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle /> WhatsApp
                </a>
              ) : (
                <span>
                  <MessageCircle /> WhatsApp
                </span>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
