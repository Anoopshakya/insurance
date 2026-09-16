import {seoMetadata} from "@/lib/seo";
export const metadata=seoMetadata("/products");
import Link from "next/link";
import { products } from "@/components/website/website-products";
export default function ProductsPage() { return <div className="public-site editorial-page"><main className="public-inner"><header className="public-page-hero"><span>EXPLORE YOUR OPTIONS</span><h1>Protection for different parts of life</h1><p>Choose a product to understand the features, prepare your questions and request a quotation.</p><Link className="site-gradient" href="/insurance">Browse insurer products and plans</Link></header><section className="editorial-card-grid">{products.map(product => <article key={product.slug}><b className="editorial-product-tag" aria-hidden="true">{product.icon}</b><h2>{product.name}</h2><p>{product.copy}</p><Link href={"/products/" + product.slug}>Explore options &rarr;</Link></article>)}</section></main></div>; }
