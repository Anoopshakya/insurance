"use client";
import Link from "next/link";
import { QuotationProductSelect } from "./quotation-product-select";
import { FormEvent, useId, useState } from "react";
import { ArrowRight, CheckCircle2, Mail, LockKeyhole, Heart, Car, Headphones, Phone } from "lucide-react";
import { products, productForPath, hasQuotationForm } from "./website-products";
import { quoteRequestSchema } from "@/lib/quote-request";

export default function QuotationForm({ pathname, initialProduct, sectionId = "get-quotation" }: { pathname: string; initialProduct?: string; sectionId?: string }) {
  const detected = productForPath(pathname);
  const [productType, setProductType] = useState(initialProduct || detected?.type || "");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const id = useId();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const parsed = quoteRequestSchema.safeParse({
      customerName: form.get("customerName"), mobile: form.get("mobile"), productType,
      selections: { product: products.find(product => product.type === productType)?.name || "" },
      email: form.get("email"), sourcePath: pathname, website: form.get("website"),
    });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Check your details."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/public/quote-requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
      const result = await response.json();
      if (!response.ok || !result.data?.id) throw new Error(result.error || "Unable to submit your request. Please try again.");
      setReference(result.data.id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to connect. Please try again."); }
    finally { setBusy(false); }
  }
  return <>
  <section id={sectionId} className="quotation-section" aria-labelledby={id + "-title"}>
    <div className="quotation-intro"><h2 id={id + "-title"}>Get Your {products.find(product => product.type === productType)?.name || "Insurance"} Quote</h2><p>Tell us a few details and we&apos;ll help you find the best plans.</p></div>
    {reference ? <div className="quotation-success" role="status"><CheckCircle2 size={36} aria-hidden="true" /><h3>Your request is with us</h3><p>Our team will contact you on the number you provided.</p><small>Reference: {reference.slice(0, 8).toUpperCase()}</small><button type="button" onClick={() => { setReference(""); setError(""); }}>Request another quotation</button></div> :
    <form className="quotation-form" onSubmit={submit} noValidate aria-busy={busy}>
      <div className="quotation-fields"><label className="mp-label" htmlFor={id + "-name"}>Full name<input className="mp-control" id={id + "-name"} name="customerName" autoComplete="name" placeholder="Enter your full name" minLength={2} maxLength={100} required disabled={busy} /></label>
      <label className="mp-label" htmlFor={id + "-phone"}>Contact Number *<span className="quotation-phone mp-input-group mp-phone-group"><span className="quotation-country" aria-label="Country code India">+91</span><input className="mp-control" id={id + "-phone"} name="mobile" type="tel" inputMode="numeric" autoComplete="tel" placeholder="Enter your mobile number" required disabled={busy}  maxLength={10} minLength={10} pattern="[0-9]{10}" onInput={event => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 10); }} /></span></label></div>
      <label className="mp-label" htmlFor={id + "-email"}>Email Address (Optional)<span className="quotation-icon-field mp-input-group"><Mail size={19} aria-hidden="true" /><input className="mp-control" id={id + "-email"} name="email" type="email" autoComplete="email" placeholder="Enter your email address" maxLength={254} disabled={busy} /></span></label>
      <QuotationProductSelect id={id + "-product"} value={productType} onChange={setProductType} disabled={busy} />
      <div className="quotation-trap" aria-hidden="true"><label className="mp-label">Website<input className="mp-control" name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {error && <p className="quotation-error" role="alert">{error}</p>}
      <button className="quotation-submit mp-form-action" type="submit" disabled={busy}>{busy ? "Sending request..." : "Get Quote"}<ArrowRight size={18} aria-hidden="true" /></button>
      <p className="quotation-safe"><LockKeyhole size={15} aria-hidden="true" />Your information is safe with us.</p>
      {/* <p className="quotation-consent">By submitting, you agree to be contacted about this enquiry. Read our <Link href="/privacy-policy">Privacy Policy</Link>.</p> */}
    </form>}
  </section>
   {/* <section className="contact-urgent mt-5"><span className="contact-icon amber"><Headphones /></span><div><h2>Need Urgent Help?</h2><p>For claims, policy servicing or other urgent requests, call us directly.</p><a href="tel:+917678438041"><Phone size={20} aria-hidden="true" />Call Now</a></div></section> */}
  </>;
}
