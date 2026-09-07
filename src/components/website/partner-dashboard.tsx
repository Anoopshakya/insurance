"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  CircleHelp,
  Clock3,
  Download,
  FileDown,
  FileSearch,
  FileText,
  Folder,
  Headphones,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  MoreVertical,
  Phone,
  Plus,
  Megaphone,
  PieChart,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { supabaseAuth } from "@/lib/supabase-client";
import { PartnerLeadsContent } from "@/components/website/partner-leads-content";
import { PartnerCustomersContent } from "@/components/website/partner-customers-content";
import { PartnerEarningsContent } from "@/components/website/partner-earnings-content";
import { PartnerPoliciesContent } from "@/components/website/partner-policies-content";

type IconType = LucideIcon;
type Profile = {
  agent_code: string;
  status: string;
  kyc_status: string;
  users: { full_name: string };
  profile_setup_required: boolean;
  profile_setup_skipped: boolean;
};

const nav: Array<[string, string, IconType]> = [
  ["Dashboard", "/partner", Home],
  ["Leads", "/partner/leads", Users],
  ["Customers", "/partner/customers", Users],
  ["Policies", "/partner/policies", FileText],
  ["Renewals", "/partner/renewals", RefreshCw],
  ["Earnings", "/partner/earnings", BarChart3],
  ["Reports", "/partner/reports", PieChart],
  ["Marketing Tools", "/partner/marketing", Megaphone],
  ["Documents", "/partner/documents", Folder],
  ["Support", "/partner/support", Headphones],
];

const stats: Array<[string, string, string, IconType, string]> = [
  ["Total Leads", "248", "12%", Users, "violet"],
  ["Customers", "186", "8%", UserPlus, "blue"],
  ["Policies Sold", "124", "15%", FileText, "purple"],
  ["Total Earnings", "₹ 1,28,500", "20%", WalletCards, "orange"],
];
const months = [
  ["Mar", 40, 58],
  ["Apr", 50, 72],
  ["May", 57, 78],
  ["Jun", 66, 105],
  ["Jul", 84, 132],
  ["Aug", 120, 170],
];
const leads = [
  ["Amit Verma", "98765 43210", "Health", "New", "04 Sep 2026"],
  ["Priya Singh", "87654 32109", "Motor", "Contacted", "03 Sep 2026"],
  ["Rohit Mehta", "76543 21098", "Life", "Interested", "03 Sep 2026"],
  ["Neha Kapoor", "65432 10987", "Health", "Quote Sent", "02 Sep 2026"],
  ["Vikas Jain", "98760 12345", "Term", "Follow Up", "01 Sep 2026"],
];
const actions: Array<[string, IconType]> = [
  ["Add Lead", UserPlus],
  ["Add Customer", UserPlus],
  ["Quote & Compare", FileSearch],
  ["Renewal Reminder", RefreshCw],
  ["Marketing Content", Megaphone],
  ["Download Forms", FileDown],
  ["Track Earnings", BarChart3],
  ["Get Support", Headphones],
];

const leadRows = [
  [
    "Amit Verma",
    "98765 43210",
    "Health",
    "Website",
    "New",
    "04 Sep 2026",
    "06 Sep 2026",
  ],
  [
    "Priya Singh",
    "87654 32109",
    "Motor",
    "Referral",
    "Contacted",
    "03 Sep 2026",
    "05 Sep 2026",
  ],
  [
    "Rohit Mehta",
    "76543 21098",
    "Life",
    "Campaign",
    "Interested",
    "03 Sep 2026",
    "05 Sep 2026",
  ],
  [
    "Neha Kapoor",
    "65432 10987",
    "Health",
    "Walk-in",
    "Quote Sent",
    "02 Sep 2026",
    "04 Sep 2026",
  ],
  [
    "Vikas Jain",
    "98760 12345",
    "Term",
    "Website",
    "Follow Up",
    "01 Sep 2026",
    "03 Sep 2026",
  ],
  [
    "Kavita Sharma",
    "99887 66554",
    "Motor",
    "Referral",
    "New",
    "01 Sep 2026",
    "03 Sep 2026",
  ],
  [
    "Sandeep Yadav",
    "91234 56789",
    "Health",
    "Event",
    "Contacted",
    "31 Aug 2026",
    "02 Sep 2026",
  ],
  [
    "Pooja Mehta",
    "98987 65432",
    "Life",
    "Campaign",
    "Interested",
    "30 Aug 2026",
    "01 Sep 2026",
  ],
  [
    "Anil Gupta",
    "97865 43211",
    "Motor",
    "Website",
    "Follow Up",
    "30 Aug 2026",
    "01 Sep 2026",
  ],
  [
    "Ritu Malhotra",
    "96789 12345",
    "Health",
    "Referral",
    "New",
    "29 Aug 2026",
    "31 Aug 2026",
  ],
];

function LeadsContent() {
  const summary: Array<[string, string, string, IconType, string]> = [
    ["Total Leads", "248", "12%", Users, "violet"],
    ["New Leads", "86", "18%", Clock3, "blue"],
    ["In Progress", "102", "8%", BarChart3, "orange"],
    ["Converted", "42", "20%", CircleCheck, "green"],
  ];
  return (
    <div className="pl-page">
      <div className="pl-heading">
        <div>
          <h1>Leads</h1>
          <p>
            Manage your leads, track follow-ups and convert them into customers.
          </p>
        </div>
        <button>
          <Plus /> Add Lead
        </button>
      </div>
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
        <label>
          <Search />
          <input placeholder="Search by name, mobile number, product..." />
        </label>
        <select aria-label="Product type">
          <option>All Products</option>
        </select>
        <select aria-label="Lead status">
          <option>All Status</option>
        </select>
        <select className="pl-assigned-filter" aria-label="Assigned to">
          <option>My Leads</option>
        </select>
        <button className="pl-date">
          <CalendarDays /> Select Date
        </button>
        <button className="pl-reset">Reset</button>
        <button className="pl-apply">Apply</button>
        <button className="pl-filter-mobile" aria-label="Open filters">
          <PieChart />
        </button>
      </section>
      <section className="pl-list">
        <div className="pl-list-title">
          <h2>Leads (248)</h2>
          <button>
            <Download /> Export <ChevronDown />
          </button>
        </div>
        <div className="pl-table">
          <div className="pl-table-head">
            {/* <span>□</span> */}
            <span>#</span>
            <span>Name</span>
            <span>Mobile Number</span>
            <span>Product Interest</span>
            <span>Lead Source</span>
            <span>Status</span>
            <span>Assigned On</span>
            <span>Next Follow-up</span>
            <span>Actions</span>
          </div>
          {leadRows.map((lead, index) => (
            <div className="pl-row" key={lead[0]}>
              {/* <span className="pl-check">□</span> */}
              <span className="pl-number">{index + 1}</span>
              <span className="pl-person">
                {/* <i>
                  {lead[0]
                    .split(" ")
                    .map((v) => v[0])
                    .join("")}
                </i> */}
                <b>{lead[0]}</b>
                <small>{lead[1]}</small>
              </span>
              <span className="pl-mobile">{lead[1]}</span>
              <span>
                <em className={`pl-tag product p${index % 4}`}>{lead[2]}</em>
              </span>
              <span className="pl-source">
                <em className={`pl-tag source p${index % 5}`}>{lead[3]}</em>
              </span>
              <span>
                <em className={`pl-tag status p${index % 5}`}>{lead[4]}</em>
              </span>
              <span className="pl-assigned-date">{lead[5]}</span>
              <span className="pl-follow">{lead[6]}</span>
              <span className="pl-actions">
                <Phone />
                <MessageCircle />
                <MoreVertical />
              </span>
            </div>
          ))}
        </div>
        <footer>
          <span>Showing 1 to 10 of 248 leads</span>
          <div>
            <button>‹</button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>4</button>
            <button>5</button>
            <button>…</button>
            <button>25</button>
            <button>›</button>
          </div>
        </footer>
      </section>
    </div>
  );
}

export function PartnerDashboard({
  view = "dashboard",
}: {
  view?: "dashboard" | "leads" | "customers" | "policies" | "earnings";
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menu, setMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabaseAuth.auth.getSession().then(async ({ data }) => {
      if (!data.session) return location.replace("/partner/login");
      const response = await fetch("/api/partner/me", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (!response.ok) return location.replace("/partner/login");
      const current = (await response.json()).data as Profile;
      if (current.profile_setup_required)
        return location.replace("/partner/complete-profile");
      setProfile(current);
    });
  }, []);

  async function signOut() {
    setSigningOut(true);
    await supabaseAuth.auth.signOut({ scope: "local" });
    location.replace("/partner/login");
  }

  const name = profile?.users.full_name || "Partner";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="pd-shell">
      <button
        className={`pd-backdrop ${menu ? "show" : ""}`}
        aria-label="Close menu"
        onClick={() => setMenu(false)}
      />
      <aside className={`pd-sidebar ${menu ? "open" : ""}`}>
        <div className="pd-brand">
          <Image
            src="/brand/magikpolicy-logo.png"
            alt="MagikPolicy"
            width={420}
            height={140}
          />
          <button onClick={() => setMenu(false)}>
            <X />
          </button>
        </div>
        <nav>
          {nav.map(([label, href, Icon], index) => (
            <Link
              className={
                (
                  view === "dashboard"
                    ? index === 0
                    : label === ({ leads: "Leads", customers: "Customers", policies: "Policies", earnings: "Earnings" } as const)[view]
                )
                  ? "active"
                  : ""
              }
              href={href}
              key={label}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="pd-help">
          <Headphones />
          <span>
            <b>Need Help?</b>
            {/* <small>Chat with our support team</small> */}
          </span>
          <b>→</b>
        </div>
        <small className="pd-version">
          Version 1.0.0
          <br />© 2026 MagikPolicy
        </small>
      </aside>

      <div className="pd-main">
        <header className="pd-topbar">
          <button
            className="pd-menu"
            onClick={() => setMenu(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <Image
            className="pd-mobile-logo"
            src="/brand/magikpolicy-logo.png"
            alt="MagikPolicy"
            width={80}
            height={80}
          />
          <label className="pd-search">
            <Search />
            <input placeholder="Search customers, policies, leads..." />
          </label>
          <div className="pd-top-actions">
            <button className="pd-bell">
              <Bell />
              <b>3</b>
            </button>
            <div className="pd-avatar">{initials}</div>
            <span>
              <b>{name}</b>
              <small>Partner ID: {profile?.agent_code || "..."}</small>
            </span>
            <button
              className="pd-signout"
              onClick={signOut}
              disabled={signingOut}
            >
              <LogOut />
              {signingOut ? "Signing out" : "Sign out"}
            </button>
          </div>
        </header>

        <main className="pd-content">
          {view === "leads" ? (
            <PartnerLeadsContent />
          ) : view === "customers" ? (
            <PartnerCustomersContent />
          ) : view === "earnings" ? (
            <PartnerEarningsContent />
          ) : view === "policies" ? (
            <PartnerPoliciesContent />
          ) : (
            <>
              <section className="pd-welcome">
                <p>Welcome Back,</p>
                <h1>
                  {name} <span>👋</span>
                </h1>
                <small>
                  Great to have you here! Keep helping people find the right
                  protection.
                </small>
                <em>
                  Together
                  <br />
                  for a Safer
                  <br />
                  Tomorrow
                </em>
              </section>

              <section className="pd-stats">
                {stats.map(([label, value, growth, Icon, tone]) => (
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

              <section className="pd-dashboard-grid">
                <article className="pd-card pd-sales">
                  <div className="pd-card-title">
                    <h2>Sales Overview</h2>
                    <button>
                      Last 6 Months <ChevronDown />
                    </button>
                  </div>
                  <div className="pd-legend">
                    <span className="policies">Policies Sold</span>
                    <span className="earnings">Earnings (₹ in K)</span>
                  </div>
                  <div className="pd-chart">
                    <div className="pd-axis">
                      <span>200</span>
                      <span>150</span>
                      <span>100</span>
                      <span>50</span>
                      <span>0</span>
                    </div>
                    {months.map(([month, policy, earning]) => (
                      <div className="pd-bars" key={month}>
                        <div>
                          <i style={{ height: `${policy}px` }} />
                          <b style={{ height: `${earning}px` }} />
                        </div>
                        <span>{month}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="pd-card pd-categories">
                  <div className="pd-card-title">
                    <h2>Policies by Category</h2>
                    <Link href="#">View All →</Link>
                  </div>
                  <div className="pd-category-body">
                    <div className="pd-donut">
                      <span>
                        <b>124</b>Policies
                      </span>
                    </div>
                    <ul>
                      <li>
                        <i />
                        Health <b>38%</b>
                      </li>
                      <li>
                        <i />
                        Motor <b>26%</b>
                      </li>
                      <li>
                        <i />
                        Life <b>20%</b>
                      </li>
                      <li>
                        <i />
                        Term <b>10%</b>
                      </li>
                      <li>
                        <i />
                        Travel <b>6%</b>
                      </li>
                    </ul>
                  </div>
                </article>

                <article className="pd-offer">
                  <h2>
                    New Offers
                    <br />
                    for Your Customers
                  </h2>
                  <p>Top insurance plans with higher commissions.</p>
                  <button>View Offers →</button>
                  <span>🎁</span>
                </article>

                <article className="pd-card pd-recent">
                  <div className="pd-card-title">
                    <h2>Recent Leads</h2>
                    <Link href="#">View All →</Link>
                  </div>
                  <div className="pd-table">
                    <div className="head">
                      <span>Name</span>
                      <span>Mobile</span>
                      <span>Product Interest</span>
                      <span>Status</span>
                      <span>Created On</span>
                    </div>
                    {leads.map((lead) => (
                      <div key={lead[0]}>
                        {lead.map((cell, index) => (
                          <span
                            className={
                              index === 3
                                ? `status s${leads.indexOf(lead)}`
                                : ""
                            }
                            key={cell}
                          >
                            {cell}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </article>

                <div className="pd-side-stack">
                  <article className="pd-card">
                    <h2>Quick Actions</h2>
                    <div className="pd-quick">
                      {actions.map(([label, Icon]) => (
                        <button key={label}>
                          <Icon />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </article>
                  <article className="pd-card pd-resources">
                    <div className="pd-card-title">
                      <h2>Partner Resources</h2>
                      <Link href="#">View All →</Link>
                    </div>
                    <div>
                      <span>
                        📄 <b>Product Brochures</b>
                      </span>
                      <span>
                        ▶️ <b>Training Videos</b>
                      </span>
                      <span>
                        🪙 <b>Commission Structure</b>
                      </span>
                    </div>
                  </article>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <nav className="pd-bottom-nav">
        {(view === "earnings" ? [nav[0], nav[1], nav[2], nav[5]] : nav.slice(0, 4)).map(([label, href, Icon], index) => (
          <Link
            className={
              (
                view === "dashboard"
                  ? index === 0
                  : label === ({ leads: "Leads", customers: "Customers", policies: "Policies", earnings: "Earnings" } as const)[view]
              )
                ? "active"
                : ""
            }
            href={href}
            key={label}
          >
            <Icon />
            <span>{index === 0 ? "Home" : label}</span>
          </Link>
        ))}
        <button onClick={() => setMenu(true)}>
          <CircleHelp />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
