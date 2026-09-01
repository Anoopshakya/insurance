import type { ReactNode } from "react";
import "./styles/public.css";
import "./styles/public-rich.css";
import "./styles/public-auth.css";
import { WebsiteHeader } from "@/components/website/website-header";
import { WebsiteFooter } from "@/components/website/website-footer";

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="website-shell">
      <WebsiteHeader />
      <div className="website-content">{children}</div>
      <WebsiteFooter />
    </div>
  );
}
