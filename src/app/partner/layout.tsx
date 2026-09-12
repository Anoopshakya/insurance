import type { ReactNode } from "react";
import { PortalRouteGuard } from "@/components/auth/portal-route-guard";
import "./partner.css";
import "./partner-skeleton.css";
import "./partner-dashboard.css";
import "./partner-leads.css";
import "./partner-customers.css";
import "./partner-earnings.css";
import "./partner-policies.css";
export default function PartnerLayout({ children }: { children: ReactNode }) {
  return <PortalRouteGuard portal="partner">{children}</PortalRouteGuard>;
}

import "./partner-team.css";
