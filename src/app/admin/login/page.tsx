"use client";

import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FormEvent, useState } from "react";
import { Icon } from "@/components/admin/icons";
import { auth } from "@/lib/firebase-client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@magikpolicy.com");
  const [password, setPassword] = useState("Magik@Admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      window.location.replace("/admin");
    } catch {
      setError("The email or password is incorrect. Please try again.");
      setLoading(false);
    }
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
        <div className="default-credentials"><strong>Development administrator</strong><span>admin@magikpolicy.com</span><span>Temporary password: Magik@Admin123</span><small>Change this password immediately after signing in.</small></div>
      </div>
    </section>
  </main>;
}
