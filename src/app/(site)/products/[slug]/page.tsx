import { LifeInsurancePage } from "@/components/website/life-insurance-page";
import { MotorInsurancePage } from "@/components/website/motor-insurance-page";
import { HealthInsurancePage } from "@/components/website/health-insurance-page";
import { WebsiteQuotation } from "@/components/website/quotation-form";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findProduct, products, quotationPageTypes } from "@/components/website/website-products";
export const dynamicParams = false;
export function generateStaticParams() { return products.flatMap(product => [product.slug, ...product.aliases].map(slug => ({ slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const product = findProduct((await params).slug); return product ? { title: product.name, description: product.copy } : {}; }
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = findProduct((await params).slug); if (!product) notFound();
  if (product.type === "life") return <LifeInsurancePage />;
  if (product.type === "motor") return <MotorInsurancePage />;
  if (product.type === "health") return <HealthInsurancePage />;
  const showQuotation = quotationPageTypes.includes(product.type);
  const enquiryHref = showQuotation ? "#get-quotation" : "/contact";
  return <div className="public-site editorial-page"><main className="public-inner">
    <nav className="editorial-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/products">Insurance products</Link><span>/</span><span aria-current="page">{product.name}</span></nav>
    <div className={showQuotation ? "product-quotation-layout" : ""}><div>
    <header className="public-page-hero"><span className="editorial-product-tag"><b aria-hidden="true">{product.icon}</b>EXPLORE YOUR COVER</span><h1>{product.name}</h1><p>{product.copy}</p><div className="editorial-links"><a href={enquiryHref}>{showQuotation ? "Get quotation" : "Contact us"} &rarr;</a><Link href="/products">Compare product categories</Link></div></header>
    <div className={showQuotation ? "editorial-grid product-content-grid" : "editorial-grid"}><div className="editorial-sections">
      <section className="editorial-section"><h2>Understand your options</h2><p>{product.overview}</p></section>
      <section className="editorial-section"><h2>What to compare</h2><ul>{product.checks.map(item => <li key={item}>{item}</li>)}</ul></section>
      <section className="editorial-section"><h2>Prepare for your quotation</h2><p>{showQuotation ? "Start with your name and phone number in the quotation form. For a more detailed conversation, it helps to have:" : "Contact the team to discuss your requirements. For a more detailed conversation, it helps to have:"}</p><ul>{product.prepare.map(item => <li key={item}>{item}</li>)}</ul></section>
      <section className="editorial-section editorial-faq"><h2>Your questions, answered</h2>{product.faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
      <p className="editorial-note">Coverage, eligibility, premium and benefits depend on the insurer and the selected policy. Review the product documents before applying.</p>
    </div>{!showQuotation && <aside className="editorial-aside"><h2>Let&apos;s talk about {product.name.toLowerCase()}</h2><p>Request a conversation about the options that fit your needs.</p><a className="site-gradient" href={enquiryHref}>{showQuotation ? "Get quotation" : "Contact us"} &rarr;</a><Link href="/faqs">Common insurance questions</Link><Link href="/claims">Claims support</Link><Link href="/renew">Renewal help</Link></aside>}</div>
    </div>{showQuotation && <aside className="product-quotation-sidebar" aria-label="Request an insurance quote"><WebsiteQuotation /></aside>}</div>
  </main></div>;
}
