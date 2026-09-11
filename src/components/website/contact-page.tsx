"use client";
import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Mail, Phone, MessageCircle, Users, Shield, Headphones, Send, Sparkles, CheckCircle2 } from "lucide-react";
import { contactRequestSchema, contactStates } from "@/lib/contact-request";
import "./contact-page.css";
export function ContactPage() {
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState("");
 const [sent, setSent] = useState(false);
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (busy) return;
  const form = event.currentTarget;
  const fields = new FormData(form);
  const parsed = contactRequestSchema.safeParse({ ...Object.fromEntries(fields), consent: fields.get("consent") === "on" });
  setError(""); setSent(false);
  if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
  setBusy(true);
  try {
   const response = await fetch("/api/public/contact-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
   const result = await response.json();
   if (!response.ok || !result.data?.id) throw new Error(result.error || "Unable to send your message. Please try again.");
   setSent(true); form.reset();
  } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to send your message. Please try again."); }
  finally { setBusy(false); }
 }
 return <main className="contact-page"><div className="contact-layout">
  <section className="contact-intro" aria-labelledby="contact-title">
   <p className="contact-eyebrow">CONTACT US</p>
   <h1 id="contact-title">We&apos;re Here<br />to <span>Help</span> <Sparkles aria-hidden="true" /></h1>
   <p className="contact-description">Have a question, need support, or just want to know more? Our team is always ready to assist you.</p>
   <div className="contact-benefits">
    <div><span className="contact-icon green"><MessageCircle /></span><p>Quick<br />Response</p></div>
    <div><span className="contact-icon purple"><Users /></span><p>Friendly<br />Support Team</p></div>
    <div><span className="contact-icon orange"><Shield /></span><p>Reliable<br />Guidance</p></div>
   </div>
   <div className="contact-art"><Image src="/brand/contact-support.png" width={640} height={640} alt="Friendly MagikPolicy support representative wearing a headset" priority /><p>Let&apos;s make<br />insurance simple<br />&mdash; together!</p></div>
  </section>
  <section className="contact-form-card" aria-labelledby="message-title">
   <div className="contact-card-heading"><span className="contact-icon purple"><Mail /></span><div><h2 id="message-title">Send us a Message</h2><p>Fill in the details and we&apos;ll get back to you shortly.</p></div></div>
   <form onSubmit={submit} noValidate aria-busy={busy}>
    <div className="contact-fields">
     <label>Full Name <b>*</b><input name="name" autoComplete="name" placeholder="Enter your full name" required maxLength={100} /></label>
     <label>Mobile Number <b>*</b><span className="contact-input-icon"><Phone size={18} aria-hidden="true" /><input name="mobile" type="tel" autoComplete="tel" placeholder="+91 98765 43210" required maxLength={20} /></span></label>
     <label>Email Address <b>*</b><span className="contact-input-icon"><Mail size={18} aria-hidden="true" /><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} /></span></label>
     <label>State<select aria-label="State" name="state" autoComplete="address-level1" defaultValue=""><option value="">Select your state</option>{contactStates.map(state => <option key={state}>{state}</option>)}</select></label>
     <label className="contact-message">Your Message <b>*</b><textarea name="message" placeholder="Type your message here..." required minLength={10} maxLength={4000} rows={6} /></label>
    </div>
    <input name="website" className="contact-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <div className="contact-form-bottom"><label className="contact-consent"><input name="consent" type="checkbox" required /><span>I agree to be contacted by MagikPolicy for my query.</span></label><button type="submit" disabled={busy}><Send size={20} aria-hidden="true" />{busy ? "Sending..." : "Send Message"}</button></div>
    {error && <p className="contact-error" role="alert">{error}</p>}
    {sent && <p className="contact-success" role="status"><CheckCircle2 size={20} aria-hidden="true" />Thank you! Your message has been received. Our team will get in touch.</p>}
   </form>
  </section>
  <aside className="contact-sidebar">
   <section className="contact-direct"><div className="contact-card-heading"><span className="contact-icon purple"><Phone /></span><div><h2>Get in Touch Directly</h2><p>Prefer to talk? Reach us through any of these channels.</p></div></div>
    <div className="contact-channels">
     <a href="tel:+917678438041"><span className="contact-icon green"><Phone /></span><div><h3>Call Us</h3><strong>+91 7678438041</strong><p>Speak with our support team</p></div></a>
     <a href="https://wa.me/918920028861" target="_blank" rel="noopener noreferrer"><span className="contact-icon green"><MessageCircle /></span><div><h3>WhatsApp Us</h3><strong>+91 8920028861</strong><p>Quick support on WhatsApp</p></div></a>
     <a href="mailto:hello@magikpolicy.com"><span className="contact-icon blue"><Mail /></span><div><h3>Email Us</h3><strong>hello@magikpolicy.com</strong><p>Send us your questions anytime</p></div></a>
    </div>
   </section>
   <section className="contact-urgent"><span className="contact-icon amber"><Headphones /></span><div><h2>Need Urgent Help?</h2><p>For claims, policy servicing or other urgent requests, call us directly.</p><a href="tel:+917678438041"><Phone size={20} aria-hidden="true" />Call Now</a></div></section>
  </aside>
 </div></main>;
}
