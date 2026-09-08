"use client";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
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
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
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
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget),
      identifier = String(form.get("identifier"));
    try {
      const lookup = await fetch("/api/customer/auth/resolve-login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ identifier }),
        }),
        resolved = await lookup.json();
      if (!lookup.ok) throw new Error(resolved.error);
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email: resolved.email,
        password: String(form.get("password")),
      });
      if (error || !data.session) throw error || new Error("Login failed.");
      const destination = await authenticatedDestination(
        data.session.access_token,
      );
      if (destination) return location.replace(destination);
      await sync(data.session.access_token, { allowCreate: false });
      location.replace("/customer");
    } catch (caught) {
      setError(message(caught));
      setLoading(false);
    }
  }
  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget),
      password = String(form.get("password"));
    if (password !== String(form.get("confirmPassword"))) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    const details = {
      fullName: String(form.get("fullName")),
      mobile: String(form.get("mobile")),
      allowCreate: true,
    };
    try {
      const { data, error } = await supabaseAuth.auth.signUp({
        email: String(form.get("email")),
        password,
        options: {
          data: {
            full_name: details.fullName,
            mobile: details.mobile,
            user_type: "customer",
          },
        },
      });
      if (error) throw error;
      if (data.session) {
        await sync(data.session.access_token, details);
        location.replace("/customer");
      } else {
        setNotice(
          "Check your email to confirm your account, then return here to sign in.",
        );
        setLoading(false);
      }
    } catch (caught) {
      setError(message(caught));
      setLoading(false);
    }
  }
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
  async function forgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const email = String(new FormData(event.currentTarget).get("resetEmail"));
    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    });
    setLoading(false);
    error
      ? setError(message(error))
      : setNotice("Password reset instructions have been sent.");
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
            : "Get started with only the details we need."}
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
        <button className="customer-google" onClick={google}>
          <b>G</b> Continue with Google
        </button>
        <div className="customer-divider">
          <span>or continue with email</span>
        </div>
        {mode === "login" ? (
          <>
            <form className="mp-form" onSubmit={login}>
              <label>
                Email or mobile number
                <input name="identifier" required />
              </label>
              <label>
                Password
                <input name="password" type="password" minLength={6} required />
              </label>
              {error && <p className="customer-error mp-form-error">{error}</p>}
              {notice && (
                <p className="customer-success mp-form-success">{notice}</p>
              )}
              <button className="mp-form-action" disabled={loading}>
                {loading ? "Signing in…" : "Login"}
              </button>
            </form>
            <details className="forgot-password">
              <summary>Forgot Password?</summary>
              <form className="mp-form" onSubmit={forgot}>
                <label>
                  Email address
                  <input name="resetEmail" type="email" required />
                </label>
                <button className="mp-form-action">Send reset link</button>
              </form>
            </details>
          </>
        ) : (
          <form className="mp-form" onSubmit={register}>
            <label>
              Full Name
              <input name="fullName" minLength={2} required />
            </label>
            <label>
              Mobile Number
              <input
                name="mobile"
                inputMode="tel"
                pattern="[0-9+ ]{10,16}"
                required
              />
            </label>
            <label>
              Email Address
              <input name="email" type="email" required />
            </label>
            <div className="customer-passwords">
              <label>
                Password
                <input name="password" type="password" minLength={6} required />
              </label>
              <label>
                Confirm Password
                <input
                  name="confirmPassword"
                  type="password"
                  minLength={6}
                  required
                />
              </label>
            </div>
            <label className="customer-terms mp-form-check">
              <input type="checkbox" required />
              <span>
                I agree to the <Link href="/terms">Terms &amp; Conditions</Link>{" "}
                and <Link href="/privacy-policy">Privacy Policy</Link>.
              </span>
            </label>
            {error && <p className="customer-error mp-form-error">{error}</p>}
            {notice && (
              <p className="customer-success mp-form-success">{notice}</p>
            )}
            <button className="mp-form-action" disabled={loading}>
              {loading ? "Creating account…" : "Create Customer Account"}
            </button>
          </form>
        )}
        <small>
          Insurance partner?{" "}
          <Link href="/partner/register">Use partner registration</Link>.
        </small>
      </section>
    </main>
  );
}
