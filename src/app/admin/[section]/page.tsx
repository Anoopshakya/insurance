import Link from "next/link";
import { Icon } from "@/components/admin/icons";

const names: Record<string, string> = { users: "Customers", partners: "Partners / Agents", products: "Products & Quotes", policies: "Policies", leads: "Leads", renewals: "Renewals", finance: "Earnings", payouts: "Payouts", referrals: "Referrals", notifications: "Notifications", messages: "Messages", profile: "Profile", risk: "Risk & compliance", support: "Support", reports: "Reports" };

export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const name = names[section];
  if (!name) return <div className="panel dashboard-state"><h1>Section not found</h1><Link className="primary-button" href="/admin">Return to dashboard</Link></div>;
  return <div className="dashboard-page"><div className="page-heading"><div><p className="admin-eyebrow">Admin workspace</p><h1>{name}</h1><p>This module is ready for its first operational workflow.</p></div><Link href="/admin" className="secondary-button"><Icon name="dashboard"/>Dashboard</Link></div><div className="panel dashboard-state"><span><Icon name="shield"/></span><h2>{name} foundation ready</h2><p>The shared navigation, permissions architecture, and responsive workspace are in place. The module’s CRUD workflow is the next implementation slice.</p></div></div>;
}
