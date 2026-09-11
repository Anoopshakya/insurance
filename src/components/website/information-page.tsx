import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import type { InformationPage as PageContent } from "./static-pages";
import { informationPages } from "./static-pages";
import { products } from "./website-products";
import { articles } from "./website-articles";

export function InformationPage({ page, article = false }: { page: PageContent; article?: boolean }) {
  return <div className="public-site editorial-page"><main className="public-inner">
    <nav className="editorial-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span>{article && <><Link href="/blog">Guides</Link><span aria-hidden="true">/</span></>}<span aria-current="page">{page.eyebrow}</span></nav>
    <header className="public-page-hero"><span>{page.eyebrow}</span><h1>{page.title}</h1><p>{page.intro}</p></header>
    <div className="editorial-grid"><div className="editorial-sections">
      {page.slug === "blog" && <div className="editorial-card-grid">{articles.map(item => <article key={item.slug}><span className="editorial-product-tag">{item.eyebrow}</span><h2>{item.title}</h2><p>{item.intro}</p><Link href={"/blog/" + item.slug}>Read guide &rarr;</Link></article>)}</div>}
      {page.slug === "sitemap" && <><section className="editorial-section"><h2>Insurance products</h2><ul>{products.map(product => <li key={product.slug}><Link href={"/products/" + product.slug}>{product.name}</Link></li>)}</ul></section><section className="editorial-section"><h2>Information and support</h2><ul>{informationPages.filter(item => item.slug !== "sitemap").map(item => <li key={item.slug}><Link href={"/" + item.slug}>{item.title}</Link></li>)}</ul></section><section className="editorial-section"><h2>Accounts and guides</h2><ul><li><Link href="/customer/login">Customer login</Link></li><li><Link href="/partner/login">Partner login</Link></li>{articles.map(item => <li key={item.slug}><Link href={"/blog/" + item.slug}>{item.title}</Link></li>)}</ul></section></>}
      {page.sections.map(section => <section className="editorial-section" key={section.title}><h2>{section.title}</h2>{section.paragraphs?.map(text => <p key={text}>{text}</p>)}{section.bullets && <ul>{section.bullets.map(text => <li key={text}>{text}</li>)}</ul>}{section.links && <div className="editorial-links">{section.links.map(link => <Link key={link.href} href={link.href}>{page.slug === "contact" && link.href.startsWith("mailto:") && <Mail size={18} aria-hidden="true" />}{page.slug === "contact" && link.href.startsWith("tel:") && <Phone size={18} aria-hidden="true" />}{link.label}</Link>)}</div>}</section>)}
      {page.faqs && <section className="editorial-section editorial-faq"><h2>Frequently asked questions</h2>{page.faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>}
    </div><aside className="editorial-aside"><h2>Find your next step</h2><p>Explore a product or ask the team to contact you about your insurance needs.</p><Link href="/products">Explore insurance <ArrowRight size={16} /></Link><Link href="/contact">Contact the team <ArrowRight size={16} /></Link></aside></div>
  </main></div>;
}
