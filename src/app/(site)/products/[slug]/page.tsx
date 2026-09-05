import { notFound } from "next/navigation";
import { LeadForm } from "@/components/website/lead-form";
import { products, PublicPage } from "@/components/website/site-shell";
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();
  return (
    <PublicPage
      eyebrow="MagikPolicy products"
      title={product.name}
      copy={product.copy}
    >
      <section className="product-detail">
        <article>
          <b>{product.icon}</b>
          <h2>Coverage that fits your life</h2>
          <p>
            Compare plans from trusted providers, understand benefits clearly,
            and get expert help before making a decision.
          </p>
          <ul>
            <li>Transparent plan comparison</li>
            <li>Expert assistance at no extra cost</li>
            <li>Secure digital application</li>
            <li>Dedicated claims support</li>
          </ul>
        </article>
        <article>
          <h2>Get personalised plan options</h2>
          <LeadForm kind={product.name} />
        </article>
      </section>
    </PublicPage>
  );
}
