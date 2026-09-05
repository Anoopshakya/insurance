"use client";
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
  const [rows, setRows] = useState<Customer[]>([]),
    [metrics, setMetrics] = useState<Metrics | null>(null),
    [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [active, setActive] = useState<Customer | null>(null),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    const r = await api(),
      b = await r.json();
    if (r.ok) {
      setRows(b.data || []);
      setMetrics(b.metrics);
    } else setError(b.error || "Customers could not be loaded.");
  }, []);
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
        <label>
          <Search />
          <input
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
          <label>
            <Search />
            <input
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
      {open && (
        <div className="pl-modal" onMouseDown={() => setOpen(false)}>
          <section onMouseDown={(e) => e.stopPropagation()}>
            <button className="pl-modal-close" onClick={() => setOpen(false)}>
              ×
            </button>
            <h2>Add Customer</h2>
            <p>Create a customer assigned to your partner account.</p>
            <form onSubmit={create}>
              <label>
                Customer name
                <input name="name" minLength={2} required />
              </label>
              <label>
                Mobile number
                <input name="contact" inputMode="tel" minLength={10} required />
              </label>
              <label>
                Email address
                <input name="email" type="email" />
              </label>
              <label>
                Address
                <textarea name="address" rows={3} />
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
