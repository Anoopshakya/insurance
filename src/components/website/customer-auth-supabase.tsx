"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  authenticatedDestination,
  finishOAuthPopup,
  signInWithGoogle,
  supabaseAuth,
} from "@/lib/supabase-client";

async function sync(
  token: string,
  details: { fullName?: string; mobile?: string; allowCreate: boolean },
) {
  const response = await fetch("/api/customer/auth/sync", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(details),
    }),
    body = await response.json();
  if (!response.ok)
    throw new Error(body.error || "Customer account could not be prepared.");
}
const message = (error: unknown) => {
  const text =
    error instanceof Error ? error.message : "Authentication failed.";
  if (/invalid login/i.test(text)) return "The email or password is incorrect.";
  if (/already registered|already been registered/i.test(text))
    return "An account already exists with this email address.";
  return text;
};

export function CustomerAuthSupabase({
  initialMode = "login",
}: {
  initialMode?: "login" | "register";
}) {
  const mode = initialMode;
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (finishOAuthPopup()) return;
    supabaseAuth.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      try {
        const destination = await authenticatedDestination(
          data.session.access_token,
        );
        if (destination) return location.replace(destination);
        await sync(data.session.access_token, { allowCreate: true });
        location.replace("/customer");
      } catch (caught) {
        setError(message(caught));
      }
    });
  }, []);
  async function google() {
    setLoading(true);
    setError("");
    try {
      const session = await signInWithGoogle(
        `${location.origin}/customer/${mode}`,
      );
      const destination = await authenticatedDestination(session.access_token);
      if (destination) return location.replace(destination);
      await sync(session.access_token, { allowCreate: mode === "register" });
      location.replace("/customer");
    } catch (caught) {
      setError(message(caught));
      setLoading(false);
    }
  }
  return (
    <main className="customer-auth-page">
      <section className="customer-auth-card">
        <Image
          src="/brand/magikpolicy-logo.png"
          alt="MagikPolicy"
          width={420}
          height={140}
        />
        <p className="customer-kicker">Customer account</p>
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p>
          {mode === "login"
            ? "Sign in to manage your policies, claims and renewals."
            : "Create your customer account securely with Google."}
        </p>
        <div className="customer-auth-tabs mp-auth-tabs">
          <Link
            className={mode === "login" ? "active" : ""}
            href="/customer/login"
          >
            Login
          </Link>
          <Link
            className={mode === "register" ? "active" : ""}
            href="/customer/register"
          >
            Register
          </Link>
        </div>
        <button type="button" className="customer-google" onClick={google} disabled={loading} aria-busy={loading}>
          <b aria-hidden="true">G</b> {loading ? "Connecting to Google?" : "Continue with Google"}
        </button>
        {error && <p role="alert" className="customer-error mp-form-error">{error}</p>}
        <p className="customer-terms">
          By continuing, you agree to our <Link href="/terms">Terms &amp; Conditions</Link> and <Link href="/privacy-policy">Privacy Policy</Link>.
        </p>
        <small>
          Insurance partner?{" "}
          <Link href="/partner/register">Use partner registration</Link>.
        </small>
      </section>
    </main>
  );
}
