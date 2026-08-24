import Image from "next/image";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <Image className="home-brand-logo" src="/brand/magikpolicy-logo.png" alt="MagikPolicy" width={420} height={140} priority />
        <p className="eyebrow">Insurance, simplified magically</p>
        <h1>Your protection, all in one place.</h1>
        <p className="description">
          MagikPolicy helps customers manage protection and gives partners a
          trusted platform to grow their insurance business.
        </p>
        <div className="status" role="status">
          <span aria-hidden="true" />
          Application online
        </div>
        <code>GET /api/agents</code>
      </section>
    </main>
  );
}
