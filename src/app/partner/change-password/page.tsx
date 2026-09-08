"use client";
import { FormEvent, useState } from "react";
import { changePassword } from "@/lib/supabase-client";
export default function PartnerChangePassword() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const password = String(form.get("password"));
      if (password !== form.get("confirmPassword")) throw new Error("Passwords do not match.");
      await changePassword(String(form.get("currentPassword")), password);
      location.replace("/partner");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Password change failed."); }
    finally { setBusy(false); }
  }
  return <main className="partner-login-page"><section className="partner-login-card"><h1>Change password</h1><form onSubmit={submit}>
    <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
    <label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
    <label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required /></label>
    {error && <p role="alert">{error}</p>}<button disabled={busy}>{busy ? "Updating..." : "Change password"}</button>
  </form></section></main>;
}
