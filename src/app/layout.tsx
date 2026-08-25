import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./public.css";
import "./public-rich.css";
import "./public-auth.css";

export const metadata: Metadata = {
  title: { default: "MagikPolicy", template: "%s | MagikPolicy" },
  description: "MagikPolicy insurance distribution and policy operations platform",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('assure-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})()` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
