"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseAuth } from "@/lib/supabase-client";
type Profile = {
  agent_code: string;
  status: string;
  kyc_status: string;
  region: string | null;
  users: { full_name: string };
  profile_setup_required: boolean;
  profile_setup_skipped: boolean;
};
export function PartnerDashboardSupabase() {
  const [p, setP] = useState<Profile | null>(null),
    [error, setError] = useState(""),
    [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    supabaseAuth.auth.getSession().then(async ({ data }) => {
      if (!data.session) return location.replace("/partner/login");
      const r = await fetch("/api/partner/me", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (!r.ok) return location.replace("/partner/login");
      const profile = (await r.json()).data as Profile;
      if (profile.profile_setup_required)
        return location.replace("/partner/complete-profile");
      setP(profile);
    });
  }, []);
  return (
    <main className="partner-home">
      <header>
        <Image
          src="/brand/magikpolicy-logo.png"
          alt="MagikPolicy"
          width={420}
          height={140}
        />
        <button
          disabled={signingOut}
          onClick={async () => {
            setSigningOut(true);
            await supabaseAuth.auth.signOut({ scope: "local" });
            location.replace("/partner/login");
          }}
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </header>
      {error ? (
        <section className="partner-home-card">
          <p>{error}</p>
        </section>
      ) : !p ? (
        <section className="partner-home-card">
          <p>Loading your workspace…</p>
        </section>
      ) : (
        <>
          <section className="partner-welcome">
            <p className="partner-kicker">Partner workspace</p>
            <h1>Welcome, {p.users.full_name}</h1>
            <p>Your MagikPolicy business account is ready.</p>
          </section>
          <section className="partner-summary">
            <article>
              <span>Partner ID</span>
              <strong>{p.agent_code}</strong>
            </article>
            <article>
              <span>Account status</span>
              <strong>{p.status}</strong>
            </article>
            <article>
              <span>KYC</span>
              <strong>{p.kyc_status.replaceAll("_", " ")}</strong>
            </article>
            <article>
              <span>Region</span>
              <strong>{p.region || "Not assigned"}</strong>
            </article>
          </section>
          {p.profile_setup_skipped && (
            <section className="partner-home-card">
              <h2>Complete your partner profile</h2>
              <p>
                You can add your verification and settlement details whenever
                you are ready.
              </p>
              <Link href="/partner/complete-profile">Complete profile</Link>
            </section>
          )}
        </>
      )}
    </main>
  );
}
