import Link from "next/link";
import { products, PublicPage } from "@/components/website/site-shell";
export default function ProductsPage() {
  return (
    <PublicPage
      eyebrow="Insurance & investments"
      title="Protection for every stage of life"
      copy="Compare trusted insurance and investment products designed around your needs and goals."
    >
      <section className="public-card-grid">
        {products.map((product) => (
          <article key={product.slug}>
            <b>{product.icon}</b>
            <h2>{product.name}</h2>
            <p>{product.copy}</p>
            <Link className="site-gradient" href={`/products/${product.slug}`}>
              Explore Plans →
            </Link>
          </article>
        ))}
      </section>
    </PublicPage>
  );
}
