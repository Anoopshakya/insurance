import type { ReactNode } from "react";
import { WebsiteShell } from "@/components/website/website-shell";
import "../../(site)/styles/public.css";
import "../../(site)/styles/public-rich.css";
import "../../(site)/styles/public-auth.css";
import "../../(site)/styles/website-responsive.css";

export default function PartnerRegisterLayout({ children }: { children: ReactNode }) {
  return <WebsiteShell>{children}</WebsiteShell>;
}
