"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { Icon } from "@/components/admin/icons";
import { supabaseAuth } from "@/lib/supabase-client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.session) throw error || new Error("Sign in failed.");
      const access = await fetch("/api/admin/me", { headers: { Authorization: "Bearer " + data.session.access_token } });
      if (!access.ok) throw new Error("This account does not have administrator access.");
      window.location.replace("/admin");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed. Please try again.");
      setLoading(false);
    }
  }

  async function forgotPassword() {
    setError(""); setNotice("");
    if (!email.trim()) { setError("Enter your email address first."); return; }
    setLoading(true);
    try {
      const { error } = await supabaseAuth.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + "/auth/reset-password" });
      if (error) throw error;
      setNotice("If this account exists, password reset instructions have been sent.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not send password reset instructions."); }
    finally { setLoading(false); }
  }

  return <main className="login-page">
    <section className="login-brand-panel">
      <Image src="/brand/magikpolicy-logo.png" alt="MagikPolicy" width={540} height={180} priority />
      <div><p className="admin-eyebrow">Operations platform</p><h1>Insurance operations, simplified magically.</h1><p>Securely manage partners, policies, earnings, renewals, and customer support from one workspace.</p></div>
      <small>Authorised MagikPolicy personnel only</small>
    </section>
    <section className="login-form-panel">
      <div className="login-card">
        <div className="mobile-login-logo"><Image src="/brand/magikpolicy-logo.png" alt="MagikPolicy" width={420} height={140} priority /></div>
        <span className="login-icon"><Icon name="shield"/></span>
        <p className="admin-eyebrow">Admin portal</p>
        <h2>Welcome back</h2>
        <p className="login-copy">Sign in to continue to your operations workspace.</p>
        <form onSubmit={submit}>
          <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
          <label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required minLength={8}/><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></div></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button login-submit" disabled={loading}>{loading ? "Signing in…" : "Sign in securely"}</button>
        </form>
        <button type="button" disabled={loading} onClick={forgotPassword}>Forgot password?</button>
        {notice && <p role="status">{notice}</p>}
      </div>
    </section>
  </main>;
}
