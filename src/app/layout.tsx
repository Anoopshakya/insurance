import { OAuthPopupBridge } from "@/components/auth/oauth-popup-bridge";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./form-system.css";

export const metadata: Metadata = {
  title: { default: "MagikPolicy", template: "%s | MagikPolicy" },
  description: "MagikPolicy insurance distribution and policy operations platform",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('assure-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})()` }} />
      </head>
      <body><OAuthPopupBridge />{children}</body>
    </html>
  );
}
