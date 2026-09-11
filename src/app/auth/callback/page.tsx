"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { authenticatedDestination, completeAuthRedirect, finishOAuthPopup } from "@/lib/supabase-client";
export default function AuthCallback() {
  const [error, setError] = useState("");
  useEffect(() => {
    if (finishOAuthPopup()) return;
    let active = true;
    async function finish() {
      try {
        const session = await completeAuthRedirect();
        const destination = await authenticatedDestination(session.access_token);
        if (!destination) throw new Error("Your account profile is not ready. Contact support.");
        if (active) location.replace(destination);
      } catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "Sign in failed."); }
    }
    void finish();
    return () => { active = false; };
  }, []);
  return <main className="auth-loading"><h1>{error ? "Unable to sign in" : "Completing sign in..."}</h1>{error && <><p role="alert">{error}</p><Link href="/partner/login">Return to sign in</Link></>}</main>;
}
