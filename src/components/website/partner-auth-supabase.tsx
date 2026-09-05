"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Headphones,
  LockKeyhole,
  Phone,
  ShieldCheck,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import {
  authenticatedDestination,
  finishOAuthPopup,
  signInWithGoogle,
  supabaseAuth,
} from "@/lib/supabase-client";
async function start(token: string) {
  const r = await fetch("/api/partner/onboarding/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),
    b = await r.json();
  if (!r.ok) throw new Error(b.error || "Partner registration failed");
}
export function PartnerAuthSupabase() {
  const [login, setLogin] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (finishOAuthPopup()) return;
    const q = new URLSearchParams(location.search);
    if (q.get("mode") === "login") setLogin(true);
    supabaseAuth.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      try {
        const destination = await authenticatedDestination(
          data.session.access_token,
        );
        if (destination) return location.replace(destination);
        await start(data.session.access_token);
        location.replace("/partner/complete-profile");
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Partner registration could not be completed",
        );
      }
    });
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const f = new FormData(e.currentTarget),
      email = String(f.get("email")),
      password = String(f.get("password"));
    try {
      if (login) {
        const { data, error } = await supabaseAuth.auth.signInWithPassword({
          email,
          password,
        });
        if (error || !data.session) throw error || new Error("Sign in failed");
        const destination = await authenticatedDestination(
          data.session.access_token,
        );
        if (!destination)
          throw new Error(
            "This account is not registered as a partner. Please register first.",
          );
        location.replace(destination);
      } else {
        if (password !== String(f.get("confirmPassword")))
          throw new Error("Passwords do not match");
        const fullName = String(f.get("fullName")),
          mobile = String(f.get("mobile"));
        const { data, error } = await supabaseAuth.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, mobile, user_type: "partner" },
          },
        });
        if (error) throw error;
        if (data.session) {
          await start(data.session.access_token);
          location.replace("/partner/complete-profile");
        } else
          setNotice("Check your email to confirm your account, then sign in.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not continue");
    }
    setBusy(false);
  }
  async function google() {
    setError("");
    try {
      const session = await signInWithGoogle(
        `${location.origin}/partner/register?account=1`,
      );
      const destination = await authenticatedDestination(session.access_token);
      if (destination) return location.replace(destination);
      await start(session.access_token);
      location.replace("/partner/complete-profile");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Google sign-in could not be started.",
      );
    }
  }
  return (
    <main className="partner-login-page">
      <section className="partner-login-card register-card">
        <Image
          src="/brand/magikpolicy-logo.png"
          alt="MagikPolicy"
          width={420}
          height={140}
        />
        <p className="partner-kicker">Partner portal</p>
        <h1>{login ? "Partner login" : "Become a partner"}</h1>
        <p>
          {login
            ? "Sign in to your insurance business workspace."
            : "Create your account, complete your profile, and submit it for approval."}
        </p>
        <nav className="mp-auth-tabs" aria-label="Partner authentication">
          <Link
            className={!login ? "active" : ""}
            href="/partner/register"
            aria-current={!login ? "page" : undefined}
          >
            Register
          </Link>
          <Link
            className={login ? "active" : ""}
            href="/partner/login"
            aria-current={login ? "page" : undefined}
          >
            Login
          </Link>
        </nav>
        <button className="social-button" onClick={google}>
          Continue with Google
        </button>
        <div className="auth-divider">
          <span>or use email</span>
        </div>
        <form className="mp-form" onSubmit={submit}>
          {!login && (
            <>
              <label>
                Full name
                <input name="fullName" minLength={2} required />
              </label>
              <label>
                Mobile number
                <input
                  name="mobile"
                  inputMode="tel"
                  pattern="[0-9+ ]{10,16}"
                  required
                />
              </label>
            </>
          )}
          <label>
            Email address
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" minLength={6} required />
          </label>
          {!login && (
            <label>
              Confirm password
              <input
                name="confirmPassword"
                type="password"
                minLength={6}
                required
              />
            </label>
          )}
          {error && <p className="partner-error mp-form-error">{error}</p>}
          {notice && (
            <p className="partner-success mp-form-success">{notice}</p>
          )}
          <button className="mp-form-action" disabled={busy}>
            {busy
              ? "Please wait…"
              : login
                ? "Sign in"
                : "Create partner account"}
          </button>
        </form>
        <small>
          <Link className="auth-mode-link" href="/partner/login">
            Already registered? Sign in
          </Link>
        </small>
      </section>
    </main>
  );
}
