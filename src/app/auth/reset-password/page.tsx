"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { completeAuthRedirect, supabaseAuth } from "@/lib/supabase-client";
export default function ResetPassword() {
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [done, setDone] = useState(false);
  useEffect(() => {
    let active = true;
    completeAuthRedirect().then(() => { if (active) setReady(true); }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const password = String(form.get("password"));
      if (password.length < 12) throw new Error("Use at least 12 characters.");
      if (password !== form.get("confirmPassword")) throw new Error("Passwords do not match.");
      const { error } = await supabaseAuth.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Password reset failed."); }
    finally { setBusy(false); }
  }
  return <main className="auth-loading"><section><h1>{done ? "Password updated" : "Set your password"}</h1>
    {!ready && !error && <p>Checking your recovery link...</p>}
    {error && <p role="alert">{error}</p>}
    {ready && !done && <form onSubmit={submit}>
      <label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
      <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required /></label>
      <button disabled={busy}>{busy ? "Updating..." : "Save password"}</button>
    </form>}
    <p><Link href="/admin/login">Admin sign in</Link> ? <Link href="/partner/login">Partner sign in</Link> ? <Link href="/customer/login">Customer sign in</Link></p>
  </section></main>;
}
