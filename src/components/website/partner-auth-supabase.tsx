"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authenticatedDestination, completeAuthRedirect, finishOAuthPopup, signInWithGoogle, supabaseAuth } from "@/lib/supabase-client";

async function start(token: string) {
  const response = await fetch("/api/partner/onboarding/start", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Partner registration failed");
}

export function PartnerAuthSupabase() {
  const [invitation, setInvitation] = useState<{ name?: string; error?: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (finishOAuthPopup()) return;
    fetch("/api/partner/invitation", { cache: "no-store" }).then((response) => response.json()).then(setInvitation).catch(() => setInvitation({ error: "Invitation could not be checked. Refresh to try again." }));
    const query = new URLSearchParams(location.search);
    (query.has("code") || location.hash.includes("access_token") ? completeAuthRedirect().then((session) => ({ data: { session } })) : supabaseAuth.auth.getSession())
      .then(async ({ data }) => {
        if (!data.session) return;
        await start(data.session.access_token);
        const destination = await authenticatedDestination(data.session.access_token, "partner");
        location.replace(destination || "/partner/complete-profile");
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not complete registration."));
  }, []);

  async function google() {
    setBusy(true);
    setError("");
    try {
      const session = await signInWithGoogle(`${location.origin}/partner/register?account=1`);
      await start(session.access_token);
      const destination = await authenticatedDestination(session.access_token, "partner");
      location.replace(destination || "/partner/complete-profile");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Google sign-in could not be started.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="partner-login-page"><section className="partner-login-card register-card">
    <Image src="/brand/magikpolicy-logo.png" alt="MagikPolicy" width={420} height={140} />
    <p className="partner-kicker">Partner portal</p>
    <h1>Become a partner</h1>
    <p>Continue securely with your Google account to create or access your partner workspace.</p>
    <nav className="mp-auth-tabs" aria-label="Partner authentication"><Link className="active" href="/partner/register" aria-current="page">Register</Link><Link href="/partner/login">Login</Link></nav>
    {invitation?.name && <p role="status">You were invited by <strong>{invitation.name}</strong>. Your team is assigned when registration completes.</p>}
    {invitation?.error && <p role="alert">{invitation.error}</p>}
    {(invitation?.name || invitation?.error) && <button type="button" className="social-button" onClick={async () => { const response = await fetch("/api/partner/invitation", { method: "DELETE" }); if (response.ok) { setInvitation({}); setError(""); history.replaceState(null, "", "/partner/register?account=1"); } }}>Continue without an invitation</button>}
    <button className="social-button" disabled={busy || !invitation || !!invitation.error} onClick={google}>{busy ? "Please wait…" : "Continue with Google"}</button>
    {error && <p className="partner-error mp-form-error">{error}</p>}
  </section></main>;
}
