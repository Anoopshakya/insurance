"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Icon, type IconName } from "./icons";
import { auth } from "@/lib/firebase-client";

const navigation: Array<{ label: string; href: string; icon: IconName }> = [
  { label: "Overview", href: "/admin", icon: "dashboard" },
  { label: "Users", href: "/admin/users", icon: "users" },
  { label: "Partners", href: "/admin/partners", icon: "partners" },
  { label: "Products", href: "/admin/products", icon: "products" },
  { label: "Policies", href: "/admin/policies", icon: "policies" },
  { label: "Leads", href: "/admin/leads", icon: "leads" },
  { label: "Finance", href: "/admin/finance", icon: "finance" },
  { label: "Risk & compliance", href: "/admin/risk", icon: "shield" },
  { label: "Support", href: "/admin/support", icon: "support" },
  { label: "Reports", href: "/admin/reports", icon: "reports" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
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
    <div className="admin-shell">
      <button className={`admin-backdrop ${open ? "is-open" : ""}`} aria-label="Close navigation" onClick={() => setOpen(false)} />
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <Link href="/admin" className="admin-brand" onClick={() => setOpen(false)}>
          <Image className="brand-logo brand-logo-light" src="/brand/magikpolicy-logo.png" alt="MagikPolicy" width={420} height={140} priority />
          <span className="brand-context">Admin</span>
        </Link>
        <nav aria-label="Admin navigation">
          <p className="admin-nav-label">Workspace</p>
          {navigation.map((item) => {
            const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} className={active ? "active" : ""} onClick={() => setOpen(false)}><Icon name={item.icon}/><span>{item.label}</span></Link>;
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <span className="environment-dot" />
          <span><strong>Production workspace</strong><small>All systems monitored</small></span>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setOpen(true)}><Icon name="menu"/></button>
          <div className="admin-search"><Icon name="search"/><span>Search customers, policies, partners…</span><kbd>⌘ K</kbd></div>
          <div className="topbar-actions">
            <button className="icon-button theme-toggle" aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} onClick={toggleTheme}><Icon name={theme === "light" ? "moon" : "sun"}/></button>
            <button className="icon-button" aria-label="Notifications"><Icon name="bell"/><span className="notification-dot"/></button>
            <Link href="/admin/change-password" className="admin-avatar" aria-label="Administrator security settings">AD</Link>
            <button className="logout-button" onClick={async () => { await signOut(auth); window.location.replace("/admin/login"); }}>Sign out</button>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
