"use client";
import {LeadForm} from "@/components/partner/lead-form";
import { PartnerCustomersEmpty } from "@/components/partner/partner-customers-empty";
import { PartnerSkeleton } from "@/components/partner/partner-skeleton";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  Plus,
  Search,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import { supabaseAuth } from "@/lib/supabase-client";
type Customer = {
  id: string;
  user_id: string | null;
  name: string;
  contact: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  accountStatus: string;
  policies: number;
  activePolicies: number;
  premium: number;
};
type Metrics = {
  total: number;
  registered: number;
  active: number;
  newThisMonth: number;
  totalPolicies: number;
  totalPremium: number;
};
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
async function api(init: RequestInit = {}) {
  const { data } = await supabaseAuth.auth.getSession();
  return fetch("/api/partner/customers", {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${data.session?.access_token || ""}`,
    },
  });
}
export function PartnerCustomersContent() {
  const [newCustomer,setNewCustomer]=useState<Customer|null>(null),[addLead,setAddLead]=useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Customer[]>([]),
    [metrics, setMetrics] = useState<Metrics | null>(null),
    [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [active, setActive] = useState<Customer | null>(null),
    [error, setError] = useState("");
  const load = useCallback(async () => {setLoading(true);setError("");try {
    const r = await api(),
      b = await r.json();
    if (r.ok) {
      setRows(b.data || []);
      setMetrics(b.metrics);
    } else setError(b.error || "Customers could not be loaded.");
  } catch { setError("Unable to load customers. Please refresh and try again."); } finally { setLoading(false); }}, []);
  useEffect(() => {
    void load();
  }, [load]);
  const visible = useMemo(
    () =>
      rows.filter((row) =>
        `${row.name} ${row.email || ""} ${row.contact || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [rows, query],
  );
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const r = await api({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      }),
      b = await r.json();
    setSaving(false);
    if (!r.ok) return setError(b.error || "Could not add customer.");
    setOpen(false);
    setNewCustomer(b.data);
    await load();
  }
  const cards = metrics
    ? ([
        ["Total customers", metrics.total, Users, "violet"],
        ["Registered accounts", metrics.registered, UserPlus, "blue"],
        ["Active accounts", metrics.active, UserCheck, "green"],
        ["New this month", metrics.newThisMonth, FileText, "orange"],
        ["Total policies", metrics.totalPolicies, Shield, "pink"],
        [
          "Total premium",
          money.format(metrics.totalPremium),
          WalletCards,
          "mint",
        ],
      ] as const)
    : [];
  if (loading) return <PartnerSkeleton view="customers" />;
  return (
    <div className="pc-page">
      <div className="pc-heading">
        <div>
          <p>Customer Management</p>
          <h1>Customers</h1>
          <span>
            View registered customers, contact details and insurance activity.
          </span>
        </div>
        <button onClick={() => setOpen(true)}>
          <Plus /> Add Customer
        </button>
      </div>
      {rows.length===0 ? (error ? <section className="pd-card" role="alert"><p>{error}</p><button type="button" onClick={()=>void load()}>Try again</button></section> : <PartnerCustomersEmpty onAdd={()=>setOpen(true)}/>) : <>
      <section className="pc-stats">
        {cards.map(([label, value, Icon, tone]) => (
          <article key={label}>
            <i className={tone}>
              <Icon />
            </i>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </section>
      <div className="pc-search">
        <label className="mp-label">
          <Search />
          <input className="mp-control"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or mobile"
          />
        </label>
        <button>
          <Filter />
        </button>
      </div>
      {error && <p className="partner-error">{error}</p>}
      <section className="pc-directory">
        <header>
          <div>
            <h2>Customer Directory</h2>
            <small>{visible.length} records</small>
          </div>
          <label className="mp-label">
            <Search />
            <input className="mp-control"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email or mobile"
            />
          </label>
          <button>
            Latest First <ChevronDown />
          </button>
        </header>
        <div className="pc-table">
          <div className="pc-table-head">
            <span>Customer</span>
            <span>Contact</span>
            <span>Account</span>
            <span>Policies</span>
            <span>Premium</span>
            <span>Joined</span>
            <span />
          </div>
          {visible.length===0&&<div className="pl-no-matches" role="status"><h3>No matching customers</h3><p>Try another name, email or mobile number.</p><button type="button" onClick={()=>setQuery("")}>Clear search</button></div>}
          {visible.map((row) => (
            <div className="pc-row" key={row.id}>
              <span className="pc-person">
                <i>{row.name.slice(0, 2).toUpperCase()}</i>
                <b>{row.name}</b>
                <small>
                  {row.email || "No email"}
                  <br />
                  {row.contact || "No mobile"}
                </small>
              </span>
              <span className="pc-contact">
                {row.email || "No email"}
                <small>{row.contact || "No mobile"}</small>
              </span>
              <span>
                <em className={`pc-status ${row.accountStatus}`}>
                  {row.user_id ? row.accountStatus : "CRM only"}
                </em>
              </span>
              <span className="pc-policies">
                <b>{row.policies}</b>
                <small>{row.activePolicies} active</small>
              </span>
              <span className="pc-premium">{money.format(row.premium)}</span>
              <span className="pc-joined">
                {new Date(row.created_at).toLocaleDateString("en-IN")}
              </span>
              <button className="pc-view" onClick={() => setActive(row)}>
                View <ChevronRight />
              </button>
            </div>
          ))}
        </div>
      </section>
      </>}
      {newCustomer&&!addLead&&<div className="pl-modal" role="dialog" aria-modal="true" aria-label="Customer added"><section><h2>Customer added</h2><p>Add a lead for {newCustomer.name}?</p><button onClick={()=>setNewCustomer(null)}>Not now</button><button onClick={()=>setAddLead(true)}>Yes, add lead</button></section></div>}
      {newCustomer&&addLead&&<LeadForm customer={newCustomer} close={()=>{setNewCustomer(null);setAddLead(false)}} saved={()=>{setNewCustomer(null);setAddLead(false)}}/>}
      {open && (
        <div className="pl-modal" onMouseDown={() => setOpen(false)}>
          <section onMouseDown={(e) => e.stopPropagation()}>
            <button className="pl-modal-close" onClick={() => setOpen(false)}>
              ×
            </button>
            <h2>Add Customer</h2>
            <p>Create a customer assigned to your partner account.</p>
            <form onSubmit={create}>
              <label className="mp-label">
                Customer name
                <input className="mp-control" name="name" minLength={2} required />
              </label>
              <label className="mp-label">
                Mobile number
                <span className="mp-input-group mp-phone-group"><span className="mp-country" aria-hidden="true">+91</span><input className="mp-control" name="contact" inputMode="numeric" required  maxLength={10} minLength={10} pattern="[0-9]{10}" onInput={event => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 10); }} /></span>
              </label>
              <label className="mp-label">
                Email address
                <input className="mp-control" name="email" type="email" />
              </label>
              <label className="mp-label">
                Address
                <textarea className="mp-control" name="address" rows={3} />
              </label>
              <div>
                <button type="button" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button disabled={saving}>
                  {saving ? "Creating..." : "Add Customer"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {active && (
        <div className="pc-detail-modal" onMouseDown={() => setActive(null)}>
          <section onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={() => setActive(null)}>×</button>
            <i>{active.name.slice(0, 2).toUpperCase()}</i>
            <h2>{active.name}</h2>
            <p>
              {active.email || "No email"}
              <br />
              {active.contact || "No mobile"}
            </p>
            <dl>
              <div>
                <dt>Account</dt>
                <dd>{active.user_id ? active.accountStatus : "CRM only"}</dd>
              </div>
              <div>
                <dt>Policies</dt>
                <dd>{active.policies}</dd>
              </div>
              <div>
                <dt>Active policies</dt>
                <dd>{active.activePolicies}</dd>
              </div>
              <div>
                <dt>Premium</dt>
                <dd>{money.format(active.premium)}</dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>
                  {new Date(active.created_at).toLocaleDateString("en-IN")}
                </dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{active.address || "Not provided"}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
