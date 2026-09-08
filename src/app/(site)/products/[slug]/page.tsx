import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findProduct, products } from "@/components/website/website-products";
export const dynamicParams = false;
export function generateStaticParams() { return products.flatMap(product => [product.slug, ...product.aliases].map(slug => ({ slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const product = findProduct((await params).slug); return product ? { title: product.name, description: product.copy } : {}; }
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = findProduct((await params).slug); if (!product) notFound();
  return <div className="public-site editorial-page"><main className="public-inner">
    <nav className="editorial-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/products">Insurance products</Link><span>/</span><span aria-current="page">{product.name}</span></nav>
    <header className="public-page-hero"><span className="editorial-product-tag"><b aria-hidden="true">{product.icon}</b>EXPLORE YOUR COVER</span><h1>{product.name}</h1><p>{product.copy}</p><div className="editorial-links"><a href="#get-quotation">Get quotation ?</a><Link href="/products">Compare product categories</Link></div></header>
    <div className="editorial-grid"><div className="editorial-sections">
      <section className="editorial-section"><h2>Understand your options</h2><p>{product.overview}</p></section>
      <section className="editorial-section"><h2>What to compare</h2><ul>{product.checks.map(item => <li key={item}>{item}</li>)}</ul></section>
      <section className="editorial-section"><h2>Prepare for your quotation</h2><p>Start with your name and phone number in the form below. For a more detailed conversation, it helps to have:</p><ul>{product.prepare.map(item => <li key={item}>{item}</li>)}</ul></section>
      <section className="editorial-section editorial-faq"><h2>Your questions, answered</h2>{product.faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
      <p className="editorial-note">Coverage, eligibility, premium and benefits depend on the insurer and the selected policy. Review the product documents before applying.</p>
    </div><aside className="editorial-aside"><h2>Let?s talk about {product.name.toLowerCase()}</h2><p>Request a conversation about the options that fit your needs.</p><a className="site-gradient" href="#get-quotation">Get quotation ?</a><Link href="/faqs">Common insurance questions</Link><Link href="/claims">Claims support</Link><Link href="/renew">Renewal help</Link></aside></div>
  </main></div>;
}
