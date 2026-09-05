"use client";
import { createBrowserClient } from "@supabase/ssr";

export const supabaseAuth = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function accessToken() {
  return (
    (await supabaseAuth.auth.getSession()).data.session?.access_token || ""
  );
}

export async function authenticatedDestination(token: string) {
  const customer = await fetch("/api/customer/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (customer.ok) return "/customer";
  const partner = await fetch("/api/partner/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (partner.ok) {
    const body = await partner.json();
    return body.data?.profile_setup_required
      ? "/partner/complete-profile"
      : "/partner";
  }
  return null;
}

export async function signInWithGoogle(redirectTo: string) {
  const popup = window.open(
    "",
    "magikpolicy-google-auth",
    "popup=yes,width=520,height=680,left=200,top=80",
  );
  if (!popup)
    throw new Error("Allow pop-ups for MagikPolicy to continue with Google.");
  const settingsResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,
    {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    },
  );
  const settings = settingsResponse.ok ? await settingsResponse.json() : null;
  if (!settings?.external?.google) {
    popup.close();
    throw new Error(
      "Google sign-in is not enabled yet. Please use email or mobile registration, or contact support.",
    );
  }
  const callback = new URL(redirectTo);
  callback.searchParams.set("oauth_popup", "1");
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) {
    popup.close();
    throw error || new Error("Google sign-in could not be started.");
  }
  popup.location.href = data.url;
  await new Promise<void>((resolve, reject) => {
    const timer = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error("Google sign-in was cancelled."));
      }
    }, 500);
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.data?.type !== "magikpolicy-oauth-complete"
      )
        return;
      cleanup();
      resolve();
    };
    function cleanup() {
      window.clearInterval(timer);
      window.removeEventListener("message", receive);
    }
    window.addEventListener("message", receive);
  });
  const { data: sessionData, error: sessionError } =
    await supabaseAuth.auth.getSession();
  if (sessionError || !sessionData.session)
    throw (
      sessionError ||
      new Error("Google authentication did not create a session.")
    );
  return sessionData.session;
}

export function finishOAuthPopup() {
  if (
    typeof window === "undefined" ||
    new URLSearchParams(location.search).get("oauth_popup") !== "1" ||
    !window.opener
  )
    return false;
  const complete = () => {
    window.opener.postMessage(
      { type: "magikpolicy-oauth-complete" },
      location.origin,
    );
    window.close();
  };
  supabaseAuth.auth.getSession().then(({ data }) => {
    if (data.session) complete();
  });
  const { data: listener } = supabaseAuth.auth.onAuthStateChange(
    (_event, session) => {
      if (session) {
        listener.subscription.unsubscribe();
        complete();
      }
    },
  );
  return true;
}
