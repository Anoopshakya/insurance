import { LeadForm } from "@/components/website/lead-form";
import { PublicPage } from "@/components/website/site-shell";
export default function ClaimsPage() {
  return (
    <PublicPage
      eyebrow="Claims support"
      title="Support when it matters most"
      copy="Share your policy details and our claims team will guide you through the next steps."
    >
      <section className="product-detail">
        <article>
          <h2>Simple claim assistance</h2>
          <ol>
            <li>Submit your request</li>
            <li>Receive a document checklist</li>
            <li>Track progress with our team</li>
          </ol>
        </article>
        <article>
          <LeadForm kind="claim" />
        </article>
      </section>
    </PublicPage>
  );
}
