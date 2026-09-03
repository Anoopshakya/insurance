import type { ReactNode } from "react";
import "./styles/public.css";
import "./styles/public-rich.css";
import "./styles/public-auth.css";
import "./styles/website-responsive.css";
import { WebsiteHeader } from "@/components/website/website-header";
import { WebsiteFooter } from "@/components/website/website-footer";

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="website-shell [&_a]:no-underline [&_a:hover]:no-underline [&_a:focus]:no-underline [&_a:visited]:no-underline [&_button]:no-underline">
      <WebsiteHeader />
      <div className="website-content">{children}</div>
      <WebsiteFooter />
    </div>
  );
}
