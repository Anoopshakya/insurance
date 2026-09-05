import type { ReactNode } from "react";
import "./styles/public.css";
import "./styles/public-rich.css";
import "./styles/public-auth.css";
import "./styles/website-responsive.css";
import { WebsiteShell } from "@/components/website/website-shell";

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  return <WebsiteShell>{children}</WebsiteShell>;
}
