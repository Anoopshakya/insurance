"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BarChart3, ChevronDown, CircleHelp, FileText, Folder, Headphones, Home, LogOut, Menu, Megaphone, PieChart, RefreshCw, Search, UserRound, Users, X, type LucideIcon } from "lucide-react";
import { PartnerOverview } from "@/components/partner/partner-overview";
import { usePartnerProfile } from "@/components/auth/portal-route-guard";
import { supabaseAuth } from "@/lib/supabase-client";
import { PartnerLeadsContent } from "@/components/website/partner-leads-content";
import { PartnerCustomersContent } from "@/components/website/partner-customers-content";
import { PartnerEarningsContent } from "@/components/website/partner-earnings-content";
import { PartnerPoliciesContent } from "@/components/website/partner-policies-content";

import { PartnerTeam } from "@/components/partner/partner-team";

import { PartnerProfileForm, PartnerProfileModal } from "@/components/partner/partner-profile-form";

type IconType = LucideIcon;

const nav: Array<[string, string, IconType]> = [
  ["Dashboard", "/partner", Home],
  ["Customers", "/partner/customers", Users],
  ["Leads", "/partner/leads", Users],
  ["Policies", "/partner/policies", FileText],
  ["Renewals", "/partner/renewals", RefreshCw],
  ["Earnings", "/partner/earnings", BarChart3],
  ["My Team", "/partner/team", Users],
  // ["Reports", "/partner/reports", PieChart],
  // ["Marketing Tools", "/partner/marketing", Megaphone],
  // ["Documents", "/partner/documents", Folder],
  // ["Support", "/partner/support", Headphones],
];

export function PartnerDashboard({
  view = "dashboard",
}: {
  view?: "dashboard" | "leads" | "customers" | "policies" | "earnings" | "renewals" | "team" | "profile";
}) {
  const profile = usePartnerProfile();
  const [menu, setMenu] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!accountOpen) return;
    function dismiss(event: PointerEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        accountTrigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [accountOpen]);
  const [signingOut, setSigningOut] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const incomplete = !!profile && ["not_started", "skipped", "rejected"].includes(profile.kyc_status);
  useEffect(() => {
    if (view !== "dashboard" || !incomplete) return;
    const requested = new URLSearchParams(location.search).has("completeProfile");
    if (requested || (profile?.profile_setup_required && sessionStorage.getItem(`profile-dismissed:${profile.agent_code}`) !== "1")) setProfileOpen(true);
  }, [view, incomplete, profile]);
  function closeProfile() {
    setProfileOpen(false);
    if (profile) sessionStorage.setItem(`profile-dismissed:${profile.agent_code}`, "1");
    const url = new URL(location.href); url.searchParams.delete("completeProfile"); history.replaceState(null, "", url);
  }

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
                    : label === ({ leads: "Leads", customers: "Customers", policies: "Policies", renewals: "Renewals", team: "My Team", earnings: "Earnings", profile: "Profile" } as const)[view]
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
          <Link className={`pd-profile-nav ${view === "profile" ? "active" : ""}`} href="/partner/profile">
            <UserRound />
            <span>Profile</span>
          </Link>
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
          <label className="pd-search mp-label">
            <Search />
            <input className="mp-control" placeholder="Search customers, policies, leads..." />
          </label>
          <div className="pd-top-actions">
            <div className="pd-account" ref={accountRef} onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setAccountOpen(false);
            }}>
              <button
                type="button"
                className="pd-account-trigger"
                ref={accountTrigger}
                aria-expanded={accountOpen}
                aria-controls="partner-account-dropdown"
                onClick={() => setAccountOpen(open => !open)}
              >
                <span className="pd-avatar" aria-hidden="true">{initials}</span>
                <span className="pd-account-name">{name}</span>
                <ChevronDown className={accountOpen ? "expanded" : ""} aria-hidden="true" />
              </button>
              {accountOpen && <div className="pd-account-dropdown" id="partner-account-dropdown">
                <small className="pd-account-id">Partner ID: {profile?.agent_code || "..."}</small>
                <Link href="/partner/profile" onClick={() => setAccountOpen(false)}>
                  <UserRound aria-hidden="true" />
                  Profile
                </Link>
                <button type="button" onClick={signOut} disabled={signingOut}>
                  <LogOut aria-hidden="true" />
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>}
            </div>
          </div>
        </header>

        <main className="pd-content">
          {view === "dashboard" && incomplete && <section className="pd-profile-cta"><div><strong>Complete your partner profile</strong><p>Add your personal, identity and bank details to finish verification.</p></div><button type="button" onClick={() => setProfileOpen(true)}>Complete profile</button></section>}
          {view === "profile" ? <PartnerProfileForm onComplete={() => location.reload()} /> : view === "leads" ? (
            <PartnerLeadsContent />
          ) : view === "customers" ? (
            <PartnerCustomersContent />
          ) : view === "earnings" ? (
            <PartnerEarningsContent />
          ) : view === "team" ? (
            <PartnerTeam />
          ) : view === "renewals" ? (
            <PartnerPoliciesContent renewals />
          ) : view === "policies" ? (
            <PartnerPoliciesContent />
          ) : (
            <PartnerOverview name={name} />
          )}
        </main>
      </div>

      {profileOpen && <PartnerProfileModal onClose={closeProfile} onComplete={() => location.replace("/partner")} />}

      <nav className="pd-bottom-nav">
        {(view === "earnings" ? [nav[0], nav[1], nav[2], nav[5]] : nav.slice(0, 4)).map(([label, href, Icon], index) => (
          <Link
            className={
              (
                view === "dashboard"
                  ? index === 0
                  : label === ({ leads: "Leads", customers: "Customers", policies: "Policies", renewals: "Renewals", team: "My Team", earnings: "Earnings", profile: "Profile" } as const)[view]
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
