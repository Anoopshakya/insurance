import { LeadForm } from "@/components/website/lead-form";
import { PublicPage } from "@/components/website/site-shell";
export default function ContactPage() {
  return (
    <PublicPage
      eyebrow="Contact us"
      title="We’re here to help"
      copy="Speak with our insurance support team for product, policy, claims or partner assistance."
    >
      <section className="product-detail">
        <article>
          <h2>Contact MagikPolicy</h2>
          <p>
            Call: <a href="tel:+919876543210">+91 98765 43210</a>
          </p>
          <p>
            Email:{" "}
            <a href="mailto:support@magikpolicy.com">support@magikpolicy.com</a>
          </p>
          <p>Mumbai, Maharashtra, India</p>
        </article>
        <article>
          <h2>Send us a message</h2>
          <LeadForm />
        </article>
      </section>
    </PublicPage>
  );
}
