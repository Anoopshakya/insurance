"use client";

import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/admin/icons";
import { auth } from "@/lib/firebase-client";

type DashboardData = {
  metrics: { customers: number; activePartners: number; activePolicies: number; newLeads: number; renewalsDue: number; pendingPayouts: number };
  recentPolicies: Array<{ id: string; policy_number: string; premium: number; status: string; created_at: string; customers: { name: string } | null; products: { name: string } | null; insurers: { name: string } | null }>;
  generatedAt: string;
};

const metricMeta: Array<{ key: keyof DashboardData["metrics"]; label: string; icon: IconName; format?: "currency"; tone: string }> = [
  { key: "customers", label: "Total customers", icon: "users", tone: "blue" },
  { key: "activePartners", label: "Active partners", icon: "partners", tone: "violet" },
  { key: "activePolicies", label: "Active policies", icon: "policies", tone: "green" },
  { key: "pendingPayouts", label: "Pending payouts", icon: "finance", format: "currency", tone: "amber" },
];

const number = new Intl.NumberFormat("en-IN");
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unauthenticated" | "forbidden" | "error">("loading");

  async function load(token: string) {
    setState("loading");
    try {
      const response = await fetch("/api/admin/dashboard", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (response.status === 401) return setState("unauthenticated");
      if (response.status === 403) return setState("forbidden");
      if (!response.ok) throw new Error("Dashboard request failed");
      const result = await response.json();
      setData(result.data);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) return setState("unauthenticated");
    await load(await user.getIdToken());
  }), []);

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div><p className="admin-eyebrow">Command centre</p><h1>Good morning, Admin</h1><p>Here’s what needs your attention across the business.</p></div>
        <button className="primary-button" onClick={async () => { const user = auth.currentUser; if (user) await load(await user.getIdToken(true)); }} disabled={state === "loading"}><Icon name="refresh"/>Refresh data</button>
      </div>

      {state === "loading" && <DashboardSkeleton />}
      {state !== "loading" && state !== "ready" && <DashboardState state={state} />}
      {state === "ready" && data && <DashboardContent data={data} />}
    </div>
  );
}

function DashboardContent({ data }: { data: DashboardData }) {
  return <>
    <section className="metric-grid" aria-label="Business summary">
      {metricMeta.map((item) => <article className="metric-card" key={item.key}><span className={`metric-icon ${item.tone}`}><Icon name={item.icon}/></span><div><p>{item.label}</p><strong>{item.format === "currency" ? currency.format(data.metrics[item.key]) : number.format(data.metrics[item.key])}</strong></div><span className="metric-caption">Live total</span></article>)}
    </section>

    <section className="admin-dashboard-grid">
      <article className="panel attention-panel">
        <div className="panel-heading"><div><p className="admin-eyebrow">Priority queue</p><h2>Needs attention</h2></div><span className="live-badge">Live</span></div>
        <div className="attention-list">
          <AttentionItem tone="amber" value={data.metrics.renewalsDue} title="Renewals due in 30 days" detail="Review outreach and renewal progress" href="/admin/policies" />
          <AttentionItem tone="blue" value={data.metrics.newLeads} title="New leads awaiting action" detail="Assign owners to improve response time" href="/admin/leads" />
          <AttentionItem tone="violet" value={currency.format(data.metrics.pendingPayouts)} title="Payouts pending" detail="Validate and move eligible requests forward" href="/admin/finance" />
        </div>
      </article>

      <article className="panel quick-panel">
        <div className="panel-heading"><div><p className="admin-eyebrow">Shortcuts</p><h2>Quick actions</h2></div></div>
        <div className="quick-grid">
          <QuickAction icon="partners" label="Review partners" href="/admin/partners" />
          <QuickAction icon="products" label="Manage products" href="/admin/products" />
          <QuickAction icon="finance" label="Review payouts" href="/admin/finance" />
          <QuickAction icon="reports" label="Open reports" href="/admin/reports" />
        </div>
      </article>
    </section>

    <section className="panel recent-panel">
      <div className="panel-heading"><div><p className="admin-eyebrow">Latest activity</p><h2>Recently issued policies</h2></div><Link href="/admin/policies" className="text-link">View all <Icon name="arrow"/></Link></div>
      {data.recentPolicies.length === 0 ? <div className="empty-state"><span><Icon name="policies"/></span><h3>No policies issued yet</h3><p>Newly issued policies will appear here.</p></div> : <div className="policy-list">{data.recentPolicies.map((policy) => <div className="policy-row" key={policy.id}><span className="policy-logo"><Icon name="policies"/></span><div className="policy-primary"><strong>{policy.customers?.name ?? "Customer"}</strong><span>{policy.products?.name ?? "Insurance"} · {policy.insurers?.name ?? "Insurer"}</span></div><div className="policy-reference"><span>Policy</span><strong>{policy.policy_number}</strong></div><div className="policy-premium"><span>Premium</span><strong>{currency.format(policy.premium)}</strong></div><span className={`status-pill ${policy.status.toLowerCase()}`}>{policy.status}</span><Link href={`/admin/policies/${policy.id}`} className="row-link" aria-label={`View policy ${policy.policy_number}`}><Icon name="arrow"/></Link></div>)}</div>}
    </section>
    <p className="last-updated">Last refreshed {new Date(data.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
  </>;
}

function AttentionItem({ tone, value, title, detail, href }: { tone: string; value: number | string; title: string; detail: string; href: string }) {
  return <Link href={href} className="attention-item"><span className={`attention-value ${tone}`}>{value}</span><span><strong>{title}</strong><small>{detail}</small></span><Icon name="arrow"/></Link>;
}

function QuickAction({ icon, label, href }: { icon: IconName; label: string; href: string }) {
  return <Link href={href} className="quick-action"><span><Icon name={icon}/></span><strong>{label}</strong><Icon name="arrow"/></Link>;
}

function DashboardState({ state }: { state: "unauthenticated" | "forbidden" | "error" }) {
  const copy = state === "unauthenticated" ? ["Sign in required", "Sign in with an administrator account to access operations."] : state === "forbidden" ? ["Access not granted", "Your account does not have permission to view the admin dashboard."] : ["Dashboard unavailable", "We couldn’t load operational data. Check the connection and try again."];
  return <div className="panel dashboard-state"><span><Icon name={state === "forbidden" ? "shield" : "support"}/></span><h2>{copy[0]}</h2><p>{copy[1]}</p>{state === "error" && <button className="primary-button" onClick={() => location.reload()}>Try again</button>}</div>;
}

function DashboardSkeleton() {
  return <div aria-label="Loading dashboard"><div className="metric-grid">{[1,2,3,4].map((i) => <div className="metric-card skeleton-card" key={i}><span/><div><i/><b/></div></div>)}</div><div className="admin-dashboard-grid"><div className="panel skeleton-panel"/><div className="panel skeleton-panel"/></div><div className="panel skeleton-wide"/></div>;
}
