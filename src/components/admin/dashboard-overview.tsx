"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { subscribeSession } from "@/lib/supabase-client";
import { Icon, type IconName } from "@/components/admin/icons";
type Policy = {
  id: string;
  policy_number: string;
  premium: number;
  status: string;
  created_at: string;
  customers: { name: string } | null;
  products: { name: string } | null;
  insurers: { name: string } | null;
};
type Data = {
  metrics: {
    customers: number;
    activePartners: number;
    activePolicies: number;
    newLeads: number;
    renewalsDue: number;
    pendingPayouts: number;
    premiumCollected: number;
    totalCommission: number;
  };
  recentPolicies: Policy[];
  generatedAt: string;
};
const amount = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
const count = new Intl.NumberFormat("en-IN");
export function DashboardOverview() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  useEffect(
    () =>
      subscribeSession(async (session) => {
        if (!session) return;
        const response = await fetch("/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const body = await response.json();
        response.ok ? setData(body.data) : setError(body.error);
      }, () => setError("Unable to load the dashboard. Please try again.")),
    [],
  );
  if (error)
    return (
      <div className="panel dashboard-state">
        <h2>Dashboard unavailable</h2>
        <p>{error}</p>
        <button className="primary-button" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    );
  if (!data)
    return (
      <div className="dashboard-v2-loading">
        <div />
        <div />
        <div />
      </div>
    );
  const m = data.metrics;
  const cards: [string, string, IconName, string, string][] = [
    [
      "Total Customers",
      count.format(m.customers),
      "users",
      "blue",
      "Live total",
    ],
    [
      "Active Policies",
      count.format(m.activePolicies),
      "shield",
      "violet",
      "Currently active",
    ],
    [
      "Premium Collected",
      amount(m.premiumCollected),
      "finance",
      "pink",
      "All policies",
    ],
    [
      "Renewals Due",
      count.format(m.renewalsDue),
      "refresh",
      "orange",
      "Due in next 30 days",
    ],
    [
      "Total Commission",
      amount(m.totalCommission),
      "reports",
      "blue",
      "Calculated earnings",
    ],
  ];
  const distribution = Object.entries(
    data.recentPolicies.reduce<Record<string, number>>((map, p) => {
      const name = p.products?.name || "Other";
      map[name] = (map[name] || 0) + 1;
      return map;
    }, {}),
  );
  const insurers = Object.entries(
    data.recentPolicies.reduce<Record<string, number>>((map, p) => {
      const name = p.insurers?.name || "Other";
      map[name] = (map[name] || 0) + 1;
      return map;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  return (
    <div className="dashboard-v2">
      <section className="dashboard-v2-hero">
        <div>
          <h1>Welcome back, Admin! 👋</h1>
          <p>Here&apos;s what&apos;s happening with your business today.</p>
        </div>
        <div className="hero-brand">
          <img src="/brand/magikpolicy-logo.png" alt="MagikPolicy" />
        </div>
      </section>
      <section className="dashboard-v2-body">
        <main>
          <section className="dashboard-v2-metrics">
            {cards.map((card) => (
              <article key={card[0]}>
                <span className={card[3]}>
                  <Icon name={card[2]} />
                </span>
                <div>
                  <small>{card[0]}</small>
                  <strong>{card[1]}</strong>
                  <em>{card[4]}</em>
                </div>
              </article>
            ))}
          </section>
          <section className="dashboard-chart-row">
            <article className="panel dashboard-chart">
              <header>
                <h2>Business Overview</h2>
                <select aria-label="Chart period">
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
              </header>
              <div className="chart-legend">
                <span>● Premium Collected (₹)</span>
                <span>● Policies Sold</span>
              </div>
              <svg
                viewBox="0 0 600 220"
                role="img"
                aria-label="Business performance chart"
              >
                <defs>
                  <linearGradient id="pinkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ec4899" stopOpacity=".25" />
                    <stop offset="1" stopColor="#ec4899" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  className="chart-grid-line"
                  d="M35 30H580M35 80H580M35 130H580M35 180H580"
                />
                <path
                  className="chart-blue"
                  d="M35 155 L125 100 L215 125 L305 75 L395 82 L485 38 L575 20"
                />
                <path
                  className="chart-pink-fill"
                  d="M35 180 L35 170 L125 137 L215 158 L305 115 L395 140 L485 92 L575 70 L575 180Z"
                />
                <path
                  className="chart-pink"
                  d="M35 170 L125 137 L215 158 L305 115 L395 140 L485 92 L575 70"
                />
              </svg>
              <div className="chart-labels">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </article>
            <article className="panel distribution-card">
              <h2>Policy Distribution</h2>
              <div
                className="donut"
                style={
                  {
                    "--total": Math.max(data.recentPolicies.length, 1),
                  } as React.CSSProperties
                }
              >
                <strong>
                  {m.activePolicies}
                  <small>Total Policies</small>
                </strong>
              </div>
              <div className="distribution-list">
                {(distribution.length ? distribution : [["No policies", 0]])
                  .slice(0, 5)
                  .map(([name, value], index) => (
                    <span key={name}>
                      <i className={`dot-${index}`} />
                      {name}
                      <b>{value}</b>
                    </span>
                  ))}
              </div>
            </article>
          </section>
          <section className="dashboard-bottom-row">
            <article className="panel renewal-list">
              <header>
                <h2>Upcoming Renewals</h2>
                <Link href="/admin/renewals">View all</Link>
              </header>
              {data.recentPolicies.slice(0, 4).map((policy, index) => (
                <div key={policy.id}>
                  <span>
                    {policy.customers?.name?.slice(0, 2).toUpperCase() || "CU"}
                  </span>
                  <p>
                    <strong>{policy.customers?.name || "Customer"}</strong>
                    <small>{policy.products?.name || "Insurance"}</small>
                  </p>
                  <p>
                    <small>Policy No. {policy.policy_number}</small>
                    <small>Due for follow-up</small>
                  </p>
                  <em>{10 + index * 5} Days Left</em>
                  <button aria-label="Call customer">☎</button>
                </div>
              ))}
            </article>
            <article className="panel activity-list">
              <header>
                <h2>Recent Activities</h2>
                <Link href="/admin/notifications">View all</Link>
              </header>
              {data.recentPolicies.map((policy, index) => (
                <div key={policy.id}>
                  <span>
                    <Icon name={index % 2 ? "shield" : "policies"} />
                  </span>
                  <p>
                    <strong>
                      {index % 2 ? "Policy status updated" : "Policy added"}
                    </strong>
                    <small>
                      {policy.customers?.name || "Customer"} ·{" "}
                      {policy.products?.name || "Insurance"}
                    </small>
                  </p>
                  <time>{index + 1}h ago</time>
                </div>
              ))}
            </article>
          </section>
        </main>
        <aside className="dashboard-v2-rail">
          <article className="panel task-card">
            <header>
              <h2>Today&apos;s Tasks</h2>
              <Link href="/admin/notifications">View all</Link>
            </header>
            <Task
              label={`Follow up with ${m.newLeads} leads`}
              note={`${m.newLeads} pending`}
              icon="support"
            />
            <Task
              label="Pending renewals"
              note={`${m.renewalsDue} policies`}
              icon="refresh"
            />
            <Task
              label="Review new partners"
              note={`${m.activePartners} active`}
              icon="partners"
            />
            <Task
              label="Review payout requests"
              note={amount(m.pendingPayouts)}
              icon="finance"
            />
          </article>
          <article className="panel announcement-card">
            <header>
              <h2>Announcements</h2>
              <Link href="/admin/notifications">View all</Link>
            </header>
            <p>
              <span>◈</span>New insurance products can be managed from the
              catalog.<time>Today</time>
            </p>
            <p>
              <span>▣</span>Review pending partner verification documents.
              <time>Today</time>
            </p>
            <p>
              <span>♧</span>Commission data is now visible in reports.
              <time>Recent</time>
            </p>
          </article>
          <article className="panel insurer-card">
            <header>
              <h2>Top Insurers</h2>
              <Link href="/admin/products">View all</Link>
            </header>
            {(insurers.length
              ? insurers
              : ([['No insurer data', 0]] as Array<[string, number]>))
              .slice(0, 5)
              .map(([name, value], index) => (
                <div key={name}>
                  <span>{name.slice(0, 2).toUpperCase()}</span>
                  <p>
                    <strong>{name}</strong>
                    <small>{value} Policies</small>
                    <i>
                      <b
                        style={{ width: `${Math.max(12, 100 - index * 16)}%` }}
                      />
                    </i>
                  </p>
                  <em>
                    {data.recentPolicies.length
                      ? Math.round((value / data.recentPolicies.length) * 100)
                      : 0}
                    %
                  </em>
                </div>
              ))}
          </article>
        </aside>
      </section>
    </div>
  );
}
function Task({
  label,
  note,
  icon,
}: {
  label: string;
  note: string;
  icon: IconName;
}) {
  const [done, setDone] = useState(false);
  return (
    <button className={done ? "task-done" : ""} onClick={() => setDone(!done)}>
      <i>{done ? "✓" : ""}</i>
      <span>
        <Icon name={icon} />
      </span>
      <p>
        <strong>{label}</strong>
        <small>{note}</small>
      </p>
    </button>
  );
}
