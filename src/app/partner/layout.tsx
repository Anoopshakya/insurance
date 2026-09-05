import type { ReactNode } from "react";
import { PortalRouteGuard } from "@/components/auth/portal-route-guard";
import "./partner.css";
export default function PartnerLayout({ children }: { children: ReactNode }) {
  return <PortalRouteGuard portal="partner">{children}</PortalRouteGuard>;
}
