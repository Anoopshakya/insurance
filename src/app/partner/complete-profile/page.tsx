"use client";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { authenticatedDestination, supabaseAuth } from "@/lib/supabase-client";
export default function CompletePartnerProfile() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    supabaseAuth.auth.getSession().then(async ({ data }) => {
      if (!data.session) return location.replace("/partner/login");
      const response = await fetch("/api/partner/me", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (!response.ok) {
        const destination = await authenticatedDestination(
          data.session.access_token,
        );
        return location.replace(destination || "/partner/login");
      }
      const profile = (await response.json()).data;
      if (!["not_started", "skipped"].includes(profile.kyc_status))
        location.replace("/partner");
    });
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError("");
    setLoading(true);
    const { data } = await supabaseAuth.auth.getSession();
    if (!data.session) return location.replace("/partner/login");
    const response = await fetch("/api/partner/onboarding/complete", {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
      body: formData,
    });
    if (!response.ok) {
      setError((await response.json()).error);
      setLoading(false);
      return;
    }
    location.replace("/partner");
  }
  async function skip() {
    setError("");
    setLoading(true);
    const { data } = await supabaseAuth.auth.getSession();
    if (!data.session) return location.replace("/partner/login");
    const response = await fetch("/api/partner/onboarding/skip", {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    if (!response.ok) {
      setError(
        (await response.json()).error || "Could not skip profile setup.",
      );
      setLoading(false);
      return;
    }
    location.replace("/partner");
  }
  return (
    <main className="partner-login-page profile-page">
      <section className="partner-login-card complete-profile-card">
        <div className="partner-profile-header">
          <Image
            src="/brand/magikpolicy-logo.png"
            alt="MagikPolicy"
            width={420}
            height={140}
          />
          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              await supabaseAuth.auth.signOut({ scope: "local" });
              location.replace("/partner/login");
            }}
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
        <p className="partner-kicker">Partner application</p>
        <h1>Complete Profile</h1>
        <p>
          Complete your verification and settlement details now, or skip and
          return later from your dashboard.
        </p>
        <form onSubmit={submit}>
          <fieldset>
            <legend>Personal information</legend>
            <div className="profile-form-grid">
              <label>
                Date of birth
                <input name="dateOfBirth" type="date" required />
              </label>
              <label>
                Gender
                <select name="gender" defaultValue="" required>
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </label>
              <label>
                Father / spouse name
                <input name="fatherOrSpouseName" required />
              </label>
              <label>
                Occupation
                <input name="occupation" required />
              </label>
              <label className="wide">
                Address line 1<input name="addressLine1" required />
              </label>
              <label className="wide">
                Address line 2<input name="addressLine2" />
              </label>
              <label>
                City
                <input name="city" required />
              </label>
              <label>
                State
                <input name="state" required />
              </label>
              <label>
                PIN code
                <input
                  name="postalCode"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Identity information</legend>
            <div className="profile-form-grid">
              <label>
                PAN number
                <input
                  name="panNumber"
                  maxLength={10}
                  autoCapitalize="characters"
                  placeholder="ABCDE1234F"
                  required
                />
              </label>
              <label>
                Aadhaar number
                <input
                  name="aadhaarNumber"
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="1234 5678 9012"
                  required
                />
                <small>Only the last four digits are retained.</small>
              </label>
              <label>
                PAN card document
                <input
                  name="panDocument"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  required
                />
                <small>PDF, JPG or PNG · 5 MB maximum</small>
              </label>
              <label>
                Aadhaar card document
                <input
                  name="aadhaarDocument"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  required
                />
                <small>PDF, JPG or PNG · 5 MB maximum</small>
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Bank account</legend>
            <div className="profile-form-grid">
              <label>
                Account holder
                <input name="accountHolder" required />
              </label>
              <label>
                Bank name
                <input name="bankName" required />
              </label>
              <label>
                Branch name
                <input name="branchName" required />
              </label>
              <label>
                Account type
                <select name="accountType" defaultValue="savings">
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </label>
              <label>
                Account number
                <input name="accountNumber" inputMode="numeric" required />
              </label>
              <label>
                Confirm account number
                <input
                  name="confirmAccountNumber"
                  inputMode="numeric"
                  required
                />
              </label>
              <label>
                IFSC code
                <input
                  name="ifsc"
                  maxLength={11}
                  autoCapitalize="characters"
                  placeholder="HDFC0001234"
                  required
                />
              </label>
            </div>
          </fieldset>
          {error && <p className="partner-error">{error}</p>}
          <div className="profile-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Complete Profile"}
            </button>
            <button
              className="profile-skip"
              type="button"
              onClick={skip}
              disabled={loading}
            >
              Skip for Now
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
