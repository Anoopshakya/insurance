"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authenticatedDestination, supabaseAuth } from "@/lib/supabase-client";

export type PartnerProfile = {
  agent_code: string; status: string; kyc_status: string;
  users: { full_name: string };
  profile_setup_required: boolean; profile_setup_skipped: boolean;
};
const PartnerProfileContext = createContext<PartnerProfile | null>(null);
export function usePartnerProfile() { return useContext(PartnerProfileContext); }

import { PartnerSkeleton, partnerSkeletonView } from "@/components/partner/partner-skeleton";

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
  const [error, setError] = useState("");
  const [allowed, setAllowed] = useState(isPublic);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);

  useEffect(() => {
    let active = true;
    if (isPublic) {
      setAllowed(true);
      return () => {
        active = false;
      };
    }

    setAllowed(false);
    setError("");
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
        if (!active) return;
        setPartnerProfile(profile);

      }
      setAllowed(true);
    }).catch(() => { if (active) setError("Unable to load your workspace. Please refresh and try again."); });

    return () => {
      active = false;
    };
  }, [isPublic, pathname, portal]);

  if (isPublic) return <>{children}</>;
  if (error) return <main role="alert" className={`${portal}-auth-loading`}><p>{error}</p><button type="button" onClick={() => location.reload()}>Try again</button></main>;
  if (!allowed && portal === "partner") return <PartnerSkeleton fullPage view={partnerSkeletonView(pathname)} />;
  if (!allowed)
    return (
      <main className={`${portal}-auth-loading`} aria-live="polite">
        <p>Securing your workspace...</p>
      </main>
    );
  return <PartnerProfileContext.Provider value={partnerProfile}>{children}</PartnerProfileContext.Provider>;
}
