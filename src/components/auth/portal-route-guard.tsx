"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { authenticatedDestination, supabaseAuth } from "@/lib/supabase-client";

type Portal = "customer" | "partner";

const publicRoutes: Record<Portal, string[]> = {
  customer: ["/customer/login", "/customer/register"],
  partner: ["/partner/login", "/partner/register"],
};

export function PortalRouteGuard({
  portal,
  children,
}: {
  portal: Portal;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isPublic = publicRoutes[portal].includes(pathname);
  const [allowed, setAllowed] = useState(isPublic);

  useEffect(() => {
    let active = true;
    if (isPublic) {
      setAllowed(true);
      return () => {
        active = false;
      };
    }

    setAllowed(false);
    supabaseAuth.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (!data.session) {
        location.replace(`/${portal}/login`);
        return;
      }

      const response = await fetch(`/api/${portal}/me`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (!active) return;
      if (!response.ok) {
        const destination = await authenticatedDestination(
          data.session.access_token,
        );
        location.replace(destination || `/${portal}/login`);
        return;
      }

      if (portal === "partner") {
        const profile = (await response.json()).data;
        if (
          profile.profile_setup_required &&
          pathname !== "/partner/complete-profile" && pathname !== "/partner/change-password"
        ) {
          location.replace("/partner/complete-profile");
          return;
        }
      }
      setAllowed(true);
    });

    return () => {
      active = false;
    };
  }, [isPublic, pathname, portal]);

  if (isPublic) return <>{children}</>;
  if (!allowed)
    return (
      <main className={`${portal}-auth-loading`} aria-live="polite">
        <p>Securing your workspace...</p>
      </main>
    );
  return <>{children}</>;
}
