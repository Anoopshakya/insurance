"use client";

import { FormEvent, useState } from "react";
import { Icon } from "@/components/admin/icons";
import { changePassword } from "@/lib/supabase-client";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (newPassword.length < 12) return setMessage({ type: "error", text: "Use at least 12 characters for the new password." });
    if (newPassword !== confirmPassword) return setMessage({ type: "error", text: "The new passwords do not match." });
    if (newPassword === currentPassword) return setMessage({ type: "error", text: "Choose a password different from the current one." });
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setMessage({ type: "success", text: "Password changed successfully." });
    } catch {
      setMessage({ type: "error", text: "Password could not be changed. Verify your current password and try again." });
    } finally { setLoading(false); }
  }

  return <div className="dashboard-page"><div className="page-heading"><div><p className="admin-eyebrow">Account security</p><h1>Change password</h1><p>Keep your MagikPolicy administrator account protected.</p></div></div><section className="panel password-card"><span className="login-icon"><Icon name="shield"/></span><h2>Update your password</h2><p>Use at least 12 characters with a mix of letters, numbers, and symbols.</p><form onSubmit={submit}><label>Current password<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required /></label><label>New password<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required minLength={12}/></label><label>Confirm new password<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required minLength={12}/></label>{message && <p className={message.type === "error" ? "form-error" : "form-success"} role="status">{message.text}</p>}<button className="primary-button" disabled={loading}>{loading ? "Updating…" : "Change password"}</button></form></section></div>;
}
