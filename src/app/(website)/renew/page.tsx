import { LeadForm } from "@/components/website/lead-form";
import { PublicPage } from "@/components/website/site-shell";
export default function RenewPage() {
  return (
    <PublicPage
      eyebrow="Policy renewal"
      title="Stay protected without interruption"
      copy="Request renewal help and compare updated cover before your current policy expires."
    >
      <section className="product-detail">
        <article>
          <h2>Renew with confidence</h2>
          <p>
            Our team can help review your current coverage, premium and suitable
            alternatives.
          </p>
        </article>
        <article>
          <LeadForm kind="policy renewal" />
        </article>
      </section>
    </PublicPage>
  );
}
