import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import "./admin.css";
import "./customers.css";
import "./roles/roles.css";
import "./admin-overrides.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
