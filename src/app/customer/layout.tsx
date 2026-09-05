import type { ReactNode } from "react";
import { PortalRouteGuard } from "@/components/auth/portal-route-guard";
import "./customer.css";
export default function CustomerLayout({ children }: { children: ReactNode }) {
  return <PortalRouteGuard portal="customer">{children}</PortalRouteGuard>;
}
