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

export async function authenticatedDestination(token: string, preferred: "customer" | "partner" = "customer") {
  const portals = preferred === "partner" ? ["partner", "customer"] : ["customer", "partner"];
  for (const portal of portals) {
    const response = await fetch("/api/" + portal + "/me", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!response.ok) continue;
    if (portal === "customer") return "/customer";
    return "/partner";
  }
  return null;
}

const popupStorageKey = "magikpolicy-oauth-popup";
let googleSignInPending = false;
let popupCompletionStarted = false;

export async function signInWithGoogle(redirectTo: string) {
  if (googleSignInPending) throw new Error("Google sign-in is already open. Please complete it first.");
  const returnUrl = new URL(redirectTo);
  if (returnUrl.origin !== location.origin) throw new Error("Sign-in must return to this website.");
  const popup = window.open("", "magikpolicy-google-auth", "popup=yes,width=520,height=680,left=200,top=80");
  if (!popup) throw new Error("Allow pop-ups for MagikPolicy to continue with Google.");
  googleSignInPending = true;
  const requestId = crypto.randomUUID();
  let cleanup = () => {};
  try {
    // Persists through provider navigation, even if the callback loses its query string or opener.
    popup.sessionStorage.setItem(popupStorageKey, JSON.stringify({ requestId, createdAt: Date.now() }));
    const settingsResponse = await fetch(
      process.env.NEXT_PUBLIC_SUPABASE_URL + "/auth/v1/settings",
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } },
    );
    const settings = settingsResponse.ok ? await settingsResponse.json() : null;
    if (!settings?.external?.google) throw new Error("Google sign-in is not enabled. Please use email sign-in or contact support.");
    const { data, error } = await supabaseAuth.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.origin + "/auth/callback", skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
    });
    if (error || !data.url) throw error || new Error("Google sign-in could not be started.");
    await new Promise<void>((resolve, reject) => {
      const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("magikpolicy-oauth-" + requestId) : null;
      // COOP can report a live provider popup as closed. Wait for the correlated callback.
      const accept = (message: { type?: string; requestId?: string; error?: string }) => {
        if (message?.type !== "magikpolicy-oauth-complete" || message.requestId !== requestId) return;
        cleanup();
        message.error ? reject(new Error(message.error)) : resolve();
      };
      const receive = (event: MessageEvent) => {
        if (event.origin === location.origin && event.source === popup) accept(event.data);
      };
      const timeout = window.setTimeout(() => { cleanup(); reject(new Error("Google sign-in timed out. Please try again.")); }, 180000);
      cleanup = () => { window.clearTimeout(timeout); window.removeEventListener("message", receive); channel?.close(); };
      window.addEventListener("message", receive);
      if (channel) channel.onmessage = event => accept(event.data);
      popup.location.href = data.url;
    });
    const { data: sessionData, error: sessionError } = await supabaseAuth.auth.getSession();
    if (sessionError || !sessionData.session) throw sessionError || new Error("Google authentication did not create a session. Please try again.");
    return sessionData.session;
  } finally {
    cleanup();
    try { popup.close(); } catch { /* The provider may have isolated the popup. */ }
    googleSignInPending = false;
  }
}

export function finishOAuthPopup() {
  if (typeof window === "undefined") return false;
  let requestId = "";
  try {
    const stored = sessionStorage.getItem(popupStorageKey);
    if (stored) {
      const marker = JSON.parse(stored);
      if (typeof marker.requestId === "string" && Date.now() - marker.createdAt < 180000) requestId = marker.requestId;
      else sessionStorage.removeItem(popupStorageKey);
    }
  } catch { /* Storage may be unavailable in restricted browsers. */ }
  const legacyPopup = new URLSearchParams(location.search).get("oauth_popup") === "1" && Boolean(window.opener);
  if (!requestId && !legacyPopup) return false;
  if (popupCompletionStarted) return true;
  popupCompletionStarted = true;
  void (async () => {
    let failure: string | undefined;
    try { await completeAuthRedirect(); }
    catch (error) { failure = error instanceof Error ? error.message : "Google sign-in failed. Please try again."; }
    const message = { type: "magikpolicy-oauth-complete", requestId, error: failure };
    try { window.opener?.postMessage(message, location.origin); } catch { /* BroadcastChannel handles a severed opener. */ }
    if (requestId && typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("magikpolicy-oauth-" + requestId);
      channel.postMessage(message);
      channel.close();
    }
    sessionStorage.removeItem(popupStorageKey);
    window.close();
  })();
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
