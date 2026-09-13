"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Headphones, ShieldCheck, TrendingUp, UsersRound } from "lucide-react";
import { authenticatedDestination, finishOAuthPopup, signInWithGoogle, supabaseAuth } from "@/lib/supabase-client";

export function PartnerLoginExperience() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (finishOAuthPopup()) return;
    supabaseAuth.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const destination = await authenticatedDestination(data.session.access_token, "partner");
      if (destination) location.replace(destination);
    });
  }, []);

  async function google() {
    setBusy(true);
    setError("");
    try {
      const session = await signInWithGoogle(`${location.origin}/partner/login`);
      const destination = await authenticatedDestination(session.access_token, "partner");
      if (destination) return location.replace(destination);
      throw new Error("This Google account is not registered as a partner. Please register first.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Google sign-in could not be started.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="partner-login-design">
    <section className="partner-login-story"><span>✦ Partner with MagikPolicy</span><h1>Same Vision.<br />Bigger<br /><em>Opportunities.</em></h1><p>Login to your partner account and continue<br />your journey with MagikPolicy.</p><div className="partner-login-benefits">
      <article><b><TrendingUp /></b><small>Higher<br />Rewards</small></article>
      <article><b><UsersRound /></b><small>More<br />Customers</small></article>
      <article><b><Headphones /></b><small>Dedicated<br />Support</small></article>
      <article><b><ShieldCheck /></b><small>Trusted<br />Brand</small></article>
    </div><p className="partner-signature">Partners for a<br />Safer Tomorrow</p></section>
    <div className="partner-login-people"><span /><Image src="/brand/magikpolicy-partners-hero.png" alt="Successful MagikPolicy partners" width={1024} height={1536} priority /></div>
    <section className="partner-register-card"><h2>Partner Login</h2><p>Continue securely with your registered Google account.</p>
      <nav className="mp-auth-tabs" aria-label="Partner authentication"><Link href="/partner/register">Register</Link><Link className="active" href="/partner/login" aria-current="page">Login</Link></nav>
      <button className="partner-google" type="button" onClick={google} disabled={busy}><b>G</b> {busy ? "Please wait…" : "Continue with Google"}</button>
      {error && <p className="partner-error mp-form-error">{error}</p>}
    </section>
  </main>;
}
