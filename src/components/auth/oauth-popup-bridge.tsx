"use client";
import { useEffect } from "react";
export function OAuthPopupBridge() {
 useEffect(() => {
  let hasPopupMarker = false;
  try { hasPopupMarker = Boolean(sessionStorage.getItem("magikpolicy-oauth-popup")); } catch { /* Storage can be restricted. */ }
  const legacyPopup = new URLSearchParams(location.search).get("oauth_popup") === "1" && Boolean(window.opener);
  if (!hasPopupMarker && !legacyPopup) return;
  // Ordinary pages do not need the authentication SDK just to check for a popup.
  void import("@/lib/supabase-client").then(({finishOAuthPopup}) => finishOAuthPopup()).catch(() => {
   console.error("Unable to load the sign-in callback. Please refresh this window.");
  });
 }, []);
 return null;
}
