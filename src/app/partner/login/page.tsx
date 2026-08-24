"use client";

import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FormEvent, useState } from "react";
import { auth } from "@/lib/firebase-client";
import { normalizeMobile, partnerLoginEmail } from "@/lib/partners/schema";
import { redirect } from "next/navigation";

export default function PartnerLoginPage() {
  redirect("/partner/register");
  const [mobile,setMobile]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError("");setLoading(true);try{const normalized=normalizeMobile(mobile);const credential=await signInWithEmailAndPassword(auth,partnerLoginEmail(normalized),password);const token=await credential.user.getIdTokenResult(true);window.location.replace(token.claims.mustChangePassword?"/partner/change-password":"/partner");}catch{setError("Mobile number or password is incorrect.");setLoading(false)}}
  return <main className="partner-login-page"><section className="partner-login-card"><Image src="/brand/magikpolicy-logo.png" alt="MagikPolicy" width={420} height={140} priority/><p className="partner-kicker">Partner portal</p><h1>Welcome to your business workspace</h1><p>Sign in using the mobile number registered by MagikPolicy.</p><form onSubmit={submit}><label>Mobile number<input value={mobile} onChange={(e)=>setMobile(e.target.value)} inputMode="tel" autoComplete="username" placeholder="98765 43210" required/></label><label>Password<input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" autoComplete="current-password" required minLength={6}/></label>{error&&<p className="partner-error">{error}</p>}<button disabled={loading}>{loading?"Signing in…":"Sign in"}</button></form><small>First login? Your temporary password is the last 6 digits of your registered mobile number.</small></section></main>;
}
