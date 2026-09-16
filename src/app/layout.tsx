import { OAuthPopupBridge } from "@/components/auth/oauth-popup-bridge";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";
import "./form-system.css";
import "./appearance.css";

export {rootMetadata as metadata} from "@/lib/seo";

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="/theme-init.js" strategy="afterInteractive" />
      </head>
      <body><OAuthPopupBridge />{children}</body>
    </html>
  );
}

