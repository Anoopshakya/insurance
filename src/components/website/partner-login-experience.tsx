"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Headphones, ShieldCheck, TrendingUp, UsersRound } from "lucide-react";
import {
  authenticatedDestination,
  finishOAuthPopup,
  signInWithGoogle,
  supabaseAuth,
} from "@/lib/supabase-client";

async function resolvePartnerEmail(identifier: string) {
  if (identifier.includes("@")) return identifier.trim().toLowerCase();
  const response = await fetch("/api/partner/auth/resolve-login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Partner account not found.");
  return body.email as string;
}

export function PartnerLoginExperience() {
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (finishOAuthPopup()) return;
    supabaseAuth.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const destination = await authenticatedDestination(
        data.session.access_token,
      );
      if (destination) return location.replace(destination);
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData(event.currentTarget);
      const email = await resolvePartnerEmail(identifier);
      const { data, error: authError } =
        await supabaseAuth.auth.signInWithPassword({
          email,
          password: String(form.get("password")),
        });
      if (authError || !data.session)
        throw authError || new Error("Sign in failed.");
      const destination = await authenticatedDestination(
        data.session.access_token,
      );
      if (destination) return location.replace(destination);
      throw new Error(
        "This account does not have partner access. Please complete partner registration first.",
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
      setBusy(false);
    }
  }

  async function google() {
    setError("");
    try {
      const session = await signInWithGoogle(
        `${location.origin}/partner/login`,
      );
      const destination = await authenticatedDestination(session.access_token);
      if (destination) return location.replace(destination);
      throw new Error(
        "This account is not registered as a partner. Please complete partner registration first.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Google sign-in could not be started.",
      );
    }
  }

  async function forgotPassword() {
    setError("");
    setNotice("");
    try {
      if (!identifier.trim())
        throw new Error("Enter your mobile number first.");
      const email = await resolvePartnerEmail(identifier);
      const { error: resetError } =
        await supabaseAuth.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/reset-password`,
        });
      if (resetError) throw resetError;
      setNotice(
        "Password reset instructions have been sent to your registered email.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not send reset instructions.",
      );
    }
  }

  return (
    <main className="partner-login-design">
      <section className="partner-login-story">
        <span>✦ Partner with MagikPolicy</span>
        <h1>
          Same Vision.
          <br />
          Bigger
          <br />
          <em>Opportunities.</em>
        </h1>
        <p>
          Login to your partner account and continue
          <br />
          your journey with MagikPolicy.
        </p>
        <div className="partner-login-benefits">
          <article>
            <b>
              <TrendingUp />
            </b>
            <small>
              Higher
              <br />
              Commissions
            </small>
          </article>
          <article>
            <b>
              <UsersRound />
            </b>
            <small>
              More
              <br />
              Customers
            </small>
          </article>
          <article>
            <b>
              <Headphones />
            </b>
            <small>
              Dedicated
              <br />
              Support
            </small>
          </article>
          <article>
            <b>
              <ShieldCheck />
            </b>
            <small>
              Trusted
              <br />
              Brand
            </small>
          </article>
        </div>
        <p className="partner-signature">
          Partners for a<br />
          Safer Tomorrow
        </p>
      </section>
      <div className="partner-login-people">
        <span />
        <Image
          src="/brand/magikpolicy-partners-hero.png"
          alt="Successful MagikPolicy partners"
          width={1024}
          height={1536}
          priority
        />
      </div>
      <section className="partner-register-card">
        <h2>Partner Login</h2>
        <p>Welcome back! Login to access your partner dashboard.</p>
        <nav className="mp-auth-tabs" aria-label="Partner authentication">
          <Link href="/partner/register">Register</Link>
          <Link className="active" href="/partner/login" aria-current="page">
            Login
          </Link>
        </nav>
        <form className="mp-form" onSubmit={submit}>
          <label className="mp-field">
            Mobile Number
            <input
              className="mp-control"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              name="identifier"
              inputMode="numeric"
              autoComplete="tel"
              pattern="[0-9 ]{10,13}"
              //placeholder="Enter your 10 digit mobile number"
              required
            />
          </label>
          <label className="mp-field">
            <span className="partner-password-label">
              Password
              <button type="button" onClick={forgotPassword}>
                Forgot Password?
              </button>
            </span>
            <input
              className="mp-control"
              name="password"
              type="password"
              autoComplete="current-password"
              //placeholder="Enter your password"
              minLength={6}
              required
            />
          </label>
          <label className="partner-remember mp-form-check">
            <input type="checkbox" defaultChecked /> Keep me signed in
          </label>
          {error && <p className="partner-error mp-form-error">{error}</p>}
          {notice && (
            <p className="partner-success mp-form-success">{notice}</p>
          )}
          <button
            className="partner-login-submit site-gradient mp-form-action"
            disabled={busy}
          >
            {busy ? "Logging in…" : "Login  →"}
          </button>
        </form>
        <div className="auth-divider">
          <span>OR</span>
        </div>
        <button className="partner-google" type="button" onClick={google}>
          <b>G</b> Continue with Google
        </button>
        {/* <small>
          New to MagikPolicy?{" "}
          <Link href="/partner/register">Become a Partner →</Link>
        </small> */}
      </section>
    </main>
  );
}
