"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword, deleteUser, GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, updateProfile, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

function friendlyAuthError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as {code:unknown}).code) : "";
  if (code.includes("email-already-in-use")) return "An account already exists with this email address.";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "The email/mobile number or password is incorrect.";
  if (code.includes("weak-password")) return "Use a password with at least 6 characters.";
  if (code.includes("popup-closed")) return "Google sign-in was cancelled.";
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait a moment and try again.";
  return error instanceof Error ? error.message : "Authentication could not be completed. Please try again.";
}

async function syncCustomer(user: User, details: {fullName?:string;mobile?:string;allowCreate:boolean}) {
  const token = await user.getIdToken();
  const response = await fetch("/api/customer/auth/sync", { method:"POST", headers:{ "content-type":"application/json", Authorization:`Bearer ${token}` }, body:JSON.stringify(details) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Customer account could not be prepared.");
  await user.getIdToken(true);
}

export function CustomerAuth() {
  const [mode,setMode] = useState<"login"|"register">("login");
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");

  async function login(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const lookup = await fetch("/api/customer/auth/resolve-login", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({identifier:form.get("identifier")}) });
      const resolved = await lookup.json();
      if (!lookup.ok) throw new Error(resolved.error);
      const credential = await signInWithEmailAndPassword(auth,resolved.email,String(form.get("password")));
      await syncCustomer(credential.user,{allowCreate:false});
      location.replace("/customer");
    } catch (caught) { setError(friendlyAuthError(caught)); setLoading(false); }
  }

  async function register(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget), password=String(form.get("password")), confirm=String(form.get("confirmPassword"));
    if (password !== confirm) { setError("Passwords do not match."); setLoading(false); return; }
    let created:User|null = null;
    try {
      const credential = await createUserWithEmailAndPassword(auth,String(form.get("email")).trim(),password); created=credential.user;
      await updateProfile(created,{displayName:String(form.get("fullName")).trim()});
      await syncCustomer(created,{fullName:String(form.get("fullName")),mobile:String(form.get("mobile")),allowCreate:true});
      location.replace("/customer");
    } catch (caught) {
      if (created) await deleteUser(created).catch(()=>undefined);
      setError(friendlyAuthError(caught)); setLoading(false);
    }
  }

  async function google() {
    setLoading(true); setError(""); setMessage("");
    try { const credential=await signInWithPopup(auth,new GoogleAuthProvider()); await syncCustomer(credential.user,{allowCreate:true}); location.replace("/customer"); }
    catch(caught){ setError(friendlyAuthError(caught)); setLoading(false); }
  }

  async function forgot(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const email=String(new FormData(event.currentTarget).get("resetEmail")||"").trim();
    try { await sendPasswordResetEmail(auth,email); setMessage("Password reset instructions have been sent to your email."); }
    catch(caught){ setError(friendlyAuthError(caught)); }
    setLoading(false);
  }

  return <main className="customer-auth-page"><section className="customer-auth-card">
    <Image src="/brand/magikpolicy-logo.png" alt="MagikPolicy" width={420} height={140} priority />
    <p className="customer-kicker">Customer account</p><h1>{mode==="login"?"Welcome back":"Create your account"}</h1><p>{mode==="login"?"Sign in to manage your policies, claims and renewals.":"Get started with only the details we need."}</p>
    <div className="customer-auth-tabs"><button className={mode==="login"?"active":""} onClick={()=>{setMode("login");setError("");setMessage("")}}>Login</button><button className={mode==="register"?"active":""} onClick={()=>{setMode("register");setError("");setMessage("")}}>Register</button></div>
    <button className="customer-google" onClick={google} disabled={loading}><b>G</b> Continue with Google</button><div className="customer-divider"><span>or continue with email</span></div>
    {mode==="login" ? <>
      <form onSubmit={login}><label>Email or mobile number<input name="identifier" autoComplete="username" required placeholder="name@example.com or 98765 43210" /></label><label>Password<input name="password" type="password" autoComplete="current-password" minLength={6} required /></label>{error&&<p className="customer-error">{error}</p>}{message&&<p className="customer-success">{message}</p>}<button disabled={loading}>{loading?"Signing in…":"Login"}</button></form>
      <details className="forgot-password"><summary>Forgot Password?</summary><form onSubmit={forgot}><label>Email address<input type="email" name="resetEmail" required placeholder="name@example.com" /></label><button disabled={loading}>Send reset link</button></form></details>
    </> : <form onSubmit={register}><label>Full Name<input name="fullName" autoComplete="name" minLength={2} required placeholder="Enter your full name" /></label><label>Mobile Number<input name="mobile" inputMode="tel" autoComplete="tel" pattern="[0-9+ ]{10,16}" required placeholder="98765 43210" /></label><label>Email Address<input name="email" type="email" autoComplete="email" required placeholder="name@example.com" /></label><div className="customer-passwords"><label>Password<input name="password" type="password" autoComplete="new-password" minLength={6} required /></label><label>Confirm Password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={6} required /></label></div><label className="customer-terms"><input type="checkbox" required /> <span>I agree to the <Link href="/terms">Terms &amp; Conditions</Link> and <Link href="/privacy-policy">Privacy Policy</Link>.</span></label>{error&&<p className="customer-error">{error}</p>}<button disabled={loading}>{loading?"Creating account…":"Create Customer Account"}</button></form>}
    <small>Are you an insurance agent or partner? <Link href="/partner/register">Use the partner registration flow</Link>.</small>
  </section></main>;
}
