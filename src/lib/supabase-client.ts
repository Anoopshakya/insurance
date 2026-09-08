"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";

export const supabaseAuth = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function accessToken() {
  const { data, error } = await supabaseAuth.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error("Your session has expired. Please sign in again.");
  return data.session.access_token;
}

export function subscribeSession(onSession: (session: Session | null) => void | Promise<void>, onError: (error: unknown) => void) {
  let active = true;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const { data } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (active) Promise.resolve().then(() => onSession(session)).catch(error => { if (active) onError(error); });
    }, 0);
    timers.add(timer);
  });
  return () => { active = false; timers.forEach(clearTimeout); data.subscription.unsubscribe(); };
}

export async function changePassword(currentPassword: string, password: string) {
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user?.email) throw userError || new Error("Please sign in again.");
  const { error: loginError } = await supabaseAuth.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (loginError) throw loginError;
  const { error } = await supabaseAuth.auth.updateUser({ password });
  if (error) throw error;
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

// Email links created on the server have no browser PKCE verifier. Accept their
// returned token pair explicitly; browser-initiated links use the SDK's PKCE exchange.
export async function completeAuthRedirect() {
  const query = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.slice(1));
  const failure = query.get("error_description") || fragment.get("error_description") || query.get("error") || fragment.get("error");
  if (failure) throw new Error(failure);
  const access_token = fragment.get("access_token");
  const refresh_token = fragment.get("refresh_token");
  if (access_token && refresh_token) {
    history.replaceState(null, "", location.pathname + location.search);
    const { data, error } = await supabaseAuth.auth.setSession({ access_token, refresh_token });
    if (error || !data.session) throw error || new Error("This link is invalid or expired.");
    return data.session;
  }
  if (query.has("code")) {
    const { error } = await supabaseAuth.auth.initialize();
    if (error) throw error;
  }
  const { data, error } = await supabaseAuth.auth.getSession();
  if (error || !data.session) throw error || new Error("This link is invalid or expired. Request a new link.");
  return data.session;
}
