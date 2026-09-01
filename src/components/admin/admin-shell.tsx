"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Icon, type IconName } from "./icons";
import { auth } from "@/lib/firebase-client";

type NavItem = { label: string; href: string; icon: IconName; badge?: string };
const navigation: Array<{ label?: string; items: NavItem[] }> = [
  { items: [{ label: "Dashboard", href: "/admin", icon: "dashboard" }] },
  { label: "Business", items: [
    { label: "Leads", href: "/admin/leads", icon: "leads", badge: "12" },
    { label: "Customers", href: "/admin/users", icon: "users" },
    { label: "Partners / Agents", href: "/admin/partners", icon: "partners" },
    { label: "Policies", href: "/admin/policies", icon: "policies" },
    { label: "Products & Quotes", href: "/admin/products", icon: "products" },
    { label: "Renewals", href: "/admin/renewals", icon: "refresh", badge: "18" },
  ]},
  { label: "Earnings", items: [
    { label: "Commission Categories", href: "/admin/commissions/categories", icon: "finance" },
    { label: "Commission Slabs", href: "/admin/commissions/slabs", icon: "reports" },
    { label: "Earnings", href: "/admin/finance", icon: "finance" },
    { label: "Payouts", href: "/admin/payouts", icon: "finance" },
    { label: "Referrals", href: "/admin/referrals", icon: "partners" },
  ]},
  { label: "Catalog Masters", items: [
    { label: "Product Sectors", href: "/admin/masters/sectors", icon: "products" },
    { label: "Provider Companies", href: "/admin/masters/providers", icon: "shield" },
    { label: "Product Types", href: "/admin/masters/types", icon: "reports" },
  ]},
  { label: "Engagement", items: [
    { label: "Website Announcement", href: "/admin/announcement", icon: "bell" },
    { label: "Notifications", href: "/admin/notifications", icon: "bell" },
    { label: "Messages", href: "/admin/messages", icon: "support" },
  ]},
  { label: "Account", items: [
    { label: "Profile", href: "/admin/profile", icon: "users" },
    { label: "Settings", href: "/admin/change-password", icon: "shield" },
    { label: "Support", href: "/admin/support", icon: "support" },
  ]},
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setAuthReady(true);
    if (!user && pathname !== "/admin/login") window.location.replace("/admin/login");
    if (user && pathname === "/admin/login") window.location.replace("/admin");
  }), [pathname]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    localStorage.setItem("assure-theme", next);
    setTheme(next);
  }

  if (pathname === "/admin/login") return <>{children}</>;
  if (!authReady) return <div className="auth-loading"><span className="auth-spinner"/><p>Securing your workspace…</p></div>;

  return (
    <div className={`admin-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <button className={`admin-backdrop ${open ? "is-open" : ""}`} aria-label="Close navigation" onClick={() => setOpen(false)} />
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <Link href="/admin" className="admin-brand" onClick={() => setOpen(false)}>
          <Image className="brand-logo brand-logo-light" src="/brand/magikpolicy-logo.png" alt="MagikPolicy" width={420} height={140} priority />
          <span className="brand-context">Admin</span>
        </Link>
        <nav aria-label="Admin navigation">
          {navigation.map((group, index) => <div className="admin-nav-group" key={group.label ?? index}>
            {group.label && <p className="admin-nav-label">{group.label}</p>}
            {group.items.map((item) => { const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={active ? "active" : ""} title={collapsed ? item.label : undefined} onClick={() => setOpen(false)}><Icon name={item.icon}/><span>{item.label}</span>{item.badge && <b>{item.badge}</b>}</Link>; })}
          </div>)}
        </nav>
        {/* <Link href="/admin/referrals" className="sidebar-promo"><Icon name="reports"/><strong>Grow Your Business</strong><span>Refer more, earn more</span><em>View Referrals <Icon name="arrow"/></em></Link> */}
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setOpen(true)}><Icon name="menu"/></button>
          <button className="icon-button desktop-sidebar-toggle" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={() => setCollapsed(!collapsed)}><Icon name="menu"/></button>
          <div className="admin-search"><Icon name="search"/><span>Search customers, policies, partners…</span><kbd>⌘ K</kbd></div>
          <div className="topbar-actions">
            {/* <Link className="topbar-primary-action" href="/admin/partners/new">+ <span>New Partner</span></Link> */}
            <Link className="whatsapp-action" href="/admin/messages" aria-label="Messages"><Icon name="support"/></Link>
            <button className="icon-button theme-toggle" aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} onClick={toggleTheme}><Icon name={theme === "light" ? "moon" : "sun"}/></button>
            <button className="icon-button" aria-label="Notifications"><Icon name="bell"/><span className="notification-dot"/></button>
            <Link href="/admin/change-password" className="topbar-profile" aria-label="Administrator security settings"><span className="admin-avatar">{auth.currentUser?.displayName?.split(" ").map(part=>part[0]).slice(0,2).join("")||"AD"}</span><span><strong>{auth.currentUser?.displayName||"Administrator"}</strong><small>Super administrator</small></span><Icon name="arrow"/></Link>
            <button className="logout-button" onClick={async () => { await signOut(auth); window.location.replace("/admin/login"); }}>Sign out</button>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
