"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { accessToken } from "@/lib/supabase-client";

const steps = ["Personal information", "Identity information", "Bank account"];
export function PartnerProfileForm({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<Record<string, string>>({});
  const [identitySaved, setIdentitySaved] = useState(false);
  const [aadhaarLast4, setAadhaarLast4] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      const response = await fetch("/api/partner/onboarding/complete", { headers: { Authorization: `Bearer ${await accessToken()}` }, cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      if (!active) return;
      setValues(body.data.values); setIdentitySaved(body.data.identitySaved); setAadhaarLast4(body.data.aadhaarLast4);
      const locked = body.data.status === "active" || !["not_started", "skipped", "rejected"].includes(body.data.kycStatus);
      setReadOnly(locked); setStep(locked ? 1 : body.data.step); setStatus(body.data.kycStatus); setChecking(false);
    })().catch(error => { if (active) { setError(error.message || "Unable to load profile"); setChecking(false); } });
    return () => { active = false; };
  }, []);
  useEffect(() => { heading.current?.focus(); }, [step, checking]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form); data.set("step", String(step));
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/partner/onboarding/complete", { method: "POST", headers: { Authorization: `Bearer ${await accessToken()}` }, body: data });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save profile");
      if (step === 3) { onComplete(); return; }
      if (step === 2) {
        const aadhaar = String(data.get("aadhaarNumber") || "");
        if (aadhaar) setAadhaarLast4(aadhaar.replace(/\D/g, "").slice(-4));
        setIdentitySaved(true);
        for (const name of ["aadhaarNumber", "panDocument", "aadhaarDocument"]) {
          const input = form.elements.namedItem(name) as HTMLInputElement; input.value = "";
        }
      }
      setStep(step + 1);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to save profile"); }
    finally { setLoading(false); }
  }
  if (checking) return <p role="status">Loading profile...</p>;
  if (!status) return <p role="alert" className="partner-error">{error}</p>;
  return <section className="partner-login-card complete-profile-card partner-profile-form">
    <h1 id="partner-profile-title">{readOnly ? "Partner profile" : "Complete profile"}</h1>
    <p>{readOnly ? `Verification status: ${status.replaceAll("_", " ")}` : "Save each step and return whenever you need to."}</p>
    <ol className="profile-steps" aria-label="Profile steps">{steps.map((label, index) => <li key={label} aria-current={step === index + 1 ? "step" : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
    <h2 ref={heading} tabIndex={-1} className="profile-step-title">Step {step} of 3: {steps[step - 1]}</h2>
    <form onSubmit={submit}>
          <fieldset hidden={step !== 1} disabled={loading || readOnly || step !== 1}>
            <legend>Personal information</legend>
            <div className="profile-form-grid">
              <label className="mp-label">
                Date of birth
                <input className="mp-control" name="dateOfBirth" defaultValue={values.dateOfBirth || ""} type="date" required />
              </label>
              <label className="mp-label">
                Gender
                <select className="mp-control" name="gender" defaultValue={values.gender || ""} required>
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </label>
              <label className="mp-label">
                Father / spouse name
                <input className="mp-control" name="fatherOrSpouseName" defaultValue={values.fatherOrSpouseName || ""} required />
              </label>
              <label className="mp-label">
                Occupation
                <input className="mp-control" name="occupation" defaultValue={values.occupation || ""} required />
              </label>
              <label className="wide mp-label">
                Address line 1<input className="mp-control" name="addressLine1" defaultValue={values.addressLine1 || ""} required />
              </label>
              <label className="wide mp-label">
                Address line 2<input className="mp-control" name="addressLine2" defaultValue={values.addressLine2 || ""} />
              </label>
              <label className="mp-label">
                City
                <input className="mp-control" name="city" defaultValue={values.city || ""} required />
              </label>
              <label className="mp-label">
                State
                <input className="mp-control" name="state" defaultValue={values.state || ""} required />
              </label>
              <label className="mp-label">
                PIN code
                <input className="mp-control"
                  name="postalCode" defaultValue={values.postalCode || ""}
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </label>
            </div>
          </fieldset>
          <fieldset hidden={step !== 2} disabled={loading || readOnly || step !== 2}>
            <legend>Identity information</legend>
            <div className="profile-form-grid">
              <label className="mp-label">
                PAN number
                <input className="mp-control"
                  name="panNumber" defaultValue={values.panNumber || ""}
                  maxLength={10}
                  autoCapitalize="characters"
                  placeholder="ABCDE1234F"
                  required
                />
              </label>
              <label className="mp-label">
                Aadhaar number
                <input className="mp-control"
                  name="aadhaarNumber" defaultValue={values.aadhaarNumber || ""}
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="1234 5678 9012"
                  required={!identitySaved}
                />
                <small>Only the last four digits are retained. {identitySaved && `Saved Aadhaar ending ${aadhaarLast4}. Leave identity fields unchanged to reuse saved documents.`}</small>
              </label>
              <label className="mp-label">
                PAN card document
                <input className="mp-control"
                  name="panDocument"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  required={!identitySaved}
                />
                <small>PDF, JPG or PNG · 5 MB maximum</small>
              </label>
              <label className="mp-label">
                Aadhaar card document
                <input className="mp-control"
                  name="aadhaarDocument"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  required={!identitySaved}
                />
                <small>PDF, JPG or PNG · 5 MB maximum</small>
              </label>
            </div>
          </fieldset>
          <fieldset hidden={step !== 3} disabled={loading || readOnly || step !== 3}>
            <legend>Bank account</legend>
            <div className="profile-form-grid">
              <label className="mp-label">
                Account holder
                <input className="mp-control" name="accountHolder" defaultValue={values.accountHolder || ""} required />
              </label>
              <label className="mp-label">
                Bank name
                <input className="mp-control" name="bankName" defaultValue={values.bankName || ""} required />
              </label>
              <label className="mp-label">
                Branch name
                <input className="mp-control" name="branchName" defaultValue={values.branchName || ""} required />
              </label>
              <label className="mp-label">
                Account type
                <select className="mp-control" name="accountType" defaultValue={values.accountType || ""}>
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </label>
              <label className="mp-label">
                Account number
                <input className="mp-control" name="accountNumber" defaultValue={values.accountNumber || ""} inputMode="numeric" required />
              </label>
              <label className="mp-label">
                Confirm account number
                <input className="mp-control"
                  name="confirmAccountNumber" defaultValue={values.confirmAccountNumber || ""}
                  inputMode="numeric"
                  required
                />
              </label>
              <label className="mp-label">
                IFSC code
                <input className="mp-control"
                  name="ifsc" defaultValue={values.ifsc || ""}
                  maxLength={11}
                  autoCapitalize="characters"
                  placeholder="HDFC0001234"
                  required
                />
              </label>
            </div>
          </fieldset>

      {error && <p className="partner-error" role="alert">{error}</p>}
      <div className="profile-actions">
        <button type="button" className="profile-skip" disabled={loading || step === 1} onClick={() => { setError(""); setStep(step - 1); }}>Back</button>
        {readOnly ? step < 3 && <button type="button" onClick={() => setStep(step + 1)}>Next</button> : <button className="mp-form-action" type="submit" disabled={loading}>{loading ? "Saving..." : step === 3 ? "Save and complete profile" : "Save and next"}</button>}
      </div>
    </form>
  </section>;
}

export function PartnerProfileModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    const overflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="partner-profile-modal" aria-labelledby="partner-profile-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <button type="button" className="profile-modal-close" onClick={onClose} aria-label="Close profile setup">×</button>
    <PartnerProfileForm onComplete={onComplete} />
  </dialog>;
}
