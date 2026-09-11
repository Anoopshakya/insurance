"use client";
import { useEffect } from "react";
import { finishOAuthPopup } from "@/lib/supabase-client";
export function OAuthPopupBridge() {
 useEffect(() => { finishOAuthPopup(); }, []);
 return null;
}
