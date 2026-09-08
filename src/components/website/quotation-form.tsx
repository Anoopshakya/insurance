"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useId, useState } from "react";
import { ArrowRight, CheckCircle2, Phone, ShieldCheck } from "lucide-react";
import { products, productForPath } from "./website-products";
import { quoteRequestSchema } from "@/lib/quote-request";

function QuotationForm({ pathname }: { pathname: string }) {
  const detected = productForPath(pathname);
  const [productType, setProductType] = useState(detected?.type || "");
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
      sourcePath: pathname, website: form.get("website"),
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
  return <section id="get-quotation" className="quotation-section" aria-labelledby={id + "-title"}>
    <div className="quotation-intro"><span className="quotation-eyebrow"><Phone size={16} aria-hidden="true" /> LET'S TALK ABOUT YOUR COVER</span>
      <h2 id={id + "-title"}>Get quotation<span>for the cover you need.</span></h2>
      <p>Tell us a little about yourself. Our team will contact you to understand your needs and help you explore suitable options.</p>
      <div className="quotation-assurance"><ShieldCheck size={20} aria-hidden="true" /><span>A quotation request does not purchase a policy.</span></div>
    </div>
    {reference ? <div className="quotation-success" role="status"><CheckCircle2 size={36} aria-hidden="true" /><h3>Your request is with us</h3><p>Our team will contact you on the number you provided.</p><small>Reference: {reference.slice(0, 8).toUpperCase()}</small><button type="button" onClick={() => { setReference(""); setError(""); }}>Request another quotation</button></div> :
    <form className="quotation-form" onSubmit={submit} aria-busy={busy}>
      <div className="quotation-fields"><label htmlFor={id + "-name"}>Full name<input id={id + "-name"} name="customerName" autoComplete="name" placeholder="Enter your full name" minLength={2} maxLength={100} required disabled={busy} /></label>
      <label htmlFor={id + "-phone"}>Phone number<input id={id + "-phone"} name="mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" maxLength={18} required disabled={busy} /></label></div>
      <label htmlFor={id + "-product"}>Select product<select id={id + "-product"} name="productType" value={productType} onChange={event => setProductType(event.target.value)} required disabled={busy} aria-describedby={detected ? id + "-selection" : undefined}><option value="" disabled>Choose an insurance product</option>{products.map(product => <option key={product.type} value={product.type}>{product.name}</option>)}</select></label>
      {detected && <small id={id + "-selection"}>Selected for this page. You can choose a different product.</small>}
      <div className="quotation-trap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {error && <p className="quotation-error" role="alert">{error}</p>}
      <button className="quotation-submit" type="submit" disabled={busy}>{busy ? "Sending request..." : "Get quotation"}<ArrowRight size={18} aria-hidden="true" /></button>
      <p className="quotation-consent">By submitting, you agree to be contacted about this enquiry. Read our <Link href="/privacy-policy">Privacy Policy</Link>.</p>
    </form>}
  </section>;
}

export function WebsiteQuotation() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname.endsWith("/login") || pathname.endsWith("/register")) return null;
  return <QuotationForm key={pathname} pathname={pathname} />;
}
