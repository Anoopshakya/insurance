import type { ReactNode } from "react";
import { WebsiteShell } from "@/components/website/website-shell";
import "../../(site)/styles/public.css";
import "../../(site)/styles/public-rich.css";
import "../../(site)/styles/website-responsive.css";
import "./login.css";

export default function PartnerLoginLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <WebsiteShell>{children}</WebsiteShell>;
}
