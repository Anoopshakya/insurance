import { PublicPage } from "@/components/website/site-shell";
export default function AboutPage() {
  return (
    <PublicPage
      eyebrow="About MagikPolicy"
      title="Insurance, simplified magically"
      copy="We combine technology, trusted advice and partner expertise to make financial protection easier for Indian families."
    >
      <section className="public-story">
        <article>
          <h2>Our mission</h2>
          <p>
            Make insurance and investment products understandable, accessible
            and dependable for every customer.
          </p>
        </article>
        <article>
          <h2>How we help</h2>
          <p>
            Customers compare suitable products, partners grow sustainable
            businesses, and our operations team supports the complete policy
            lifecycle.
          </p>
        </article>
        <article>
          <h2>Built on trust</h2>
          <p>
            Clear information, secure handling of data, and human assistance
            remain at the centre of every MagikPolicy experience.
          </p>
        </article>
      </section>
    </PublicPage>
  );
}
