import type { ReactNode } from "react";
import { WebsiteHeader } from "./website-header";
import { WebsiteFooter } from "./website-footer";

export function WebsiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="website-shell [&_a]:no-underline [&_a:hover]:no-underline [&_a:focus]:no-underline [&_a:visited]:no-underline [&_button]:no-underline">
      <WebsiteHeader />
      <div className="website-content">{children}</div>
      <WebsiteFooter />
    </div>
  );
}
