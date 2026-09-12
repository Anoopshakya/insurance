"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BarChart3, CircleHelp, FileText, Folder, Headphones, Home, LogOut, Menu, Megaphone, PieChart, RefreshCw, Search, Users, X, type LucideIcon } from "lucide-react";
import { PartnerOverview } from "@/components/partner/partner-overview";
import { usePartnerProfile } from "@/components/auth/portal-route-guard";
import { supabaseAuth } from "@/lib/supabase-client";
import { PartnerLeadsContent } from "@/components/website/partner-leads-content";
import { PartnerCustomersContent } from "@/components/website/partner-customers-content";
import { PartnerEarningsContent } from "@/components/website/partner-earnings-content";
import { PartnerPoliciesContent } from "@/components/website/partner-policies-content";

type IconType = LucideIcon;

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

export function PartnerDashboard({
  view = "dashboard",
}: {
  view?: "dashboard" | "leads" | "customers" | "policies" | "earnings";
}) {
  const profile = usePartnerProfile();
  const [menu, setMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
            <PartnerOverview name={name} />
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
