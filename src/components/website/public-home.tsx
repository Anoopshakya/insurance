"use client";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { products } from "./site-shell";
export function PublicHome() {
  const [product, setProduct] = useState("health");
  const [who, setWho] = useState("Self");
  const [message, setMessage] = useState("");
  function callback(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Thank you! An insurance expert will call you shortly.");
    e.currentTarget.reset();
  }
  return (
    <div className="public-site">
      <main>
        <section className="site-hero">
          <div className="hero-copy">
            <span>✦ Smart insurance for a secure tomorrow</span>
            <h1>
              Insurance.
              <br />
              Simplified.
              <br />
              <em>Magically.</em> ✦
            </h1>
            <p>
              Compare, buy and manage the best insurance and investment plans
              with ease and confidence.
            </p>
            <div>
              <Link className="site-gradient" href="/products">
                Explore Plans →
              </Link>
              <Link className="site-outline" href="#expert">
                ♧ Talk to an Expert
              </Link>
            </div>
            <small>★★★★★ &nbsp; 10,000+ happy customers &nbsp; 4.8/5</small>
          </div>
          <div className="family-hero">
            <span className="hero-logo-shape">M</span>
            <Image
              src="/brand/magikpolicy-family-hero.png"
              alt="Happy family protected by MagikPolicy"
              width={1158}
              height={1378}
              priority
            />
            <i>♡ Health Insurance</i>
            <i>▣ Motor Insurance</i>
            <i>♙ Life Insurance</i>
            <i>✈ Travel Insurance</i>
          </div>
        </section>
        <section className="quote-widget">
          <div className="quote-tabs">
            {products.map((p) => (
              <button
                className={product === p.slug ? "active" : ""}
                onClick={() => setProduct(p.slug)}
                key={p.slug}
              >
                <b>{p.icon}</b>
                {p.name.replace(" Insurance", "").replace(" Plans", "")}
              </button>
            ))}
          </div>
          <h3>Who do you want to insure?</h3>
          <div className="quote-options">
            {["Self", "Spouse", "Children", "Parents", "Family Floater"].map(
              (item) => (
                <button
                  className={who === item ? "active" : ""}
                  onClick={() => setWho(item)}
                  key={item}
                >
                  {item}
                </button>
              ),
            )}
            <Link className="site-gradient" href={`/products/${product}`}>
              View Plans →
            </Link>
          </div>
          <p>
            Already have a policy? <Link href="/renew">Renew Now →</Link>
          </p>
        </section>
        <section className="expert-row">
          <article>
            <h2>Need help choosing the right plan?</h2>
            <p>Our insurance experts are here to help you.</p>
            <div>
              <span>
                ♙<b>Free Consultation</b>
              </span>
              <span>
                ♢<b>No Obligation</b>
              </span>
              <span>
                ⌾<b>100% Confidential</b>
              </span>
            </div>
          </article>
          <article id="expert">
            <h2>Talk to an insurance expert</h2>
            <p>Get a free call back from our expert.</p>
            <form onSubmit={callback}>
              <input className="mp-control"
                required
                inputMode="numeric"

                placeholder="Enter Mobile Number"
               maxLength={10} minLength={10} pattern="[0-9]{10}" onInput={event => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 10); }} />
              <button className="site-gradient">Request a Call</button>
            </form>
            {message && <small>{message}</small>}
          </article>
        </section>
        <section className="trust-strip">
          {[
            ["♢", "Trusted Plans", "Top insurers, 100% trusted."],
            ["₹", "Best Prices", "Compare and get the best deals."],
            ["♧", "Expert Support", "We're here for you, always."],
            ["♢", "Quick & Easy", "Buy in minutes, stay protected."],
            ["▣", "Secure & Safe", "Your data is safe with us."],
          ].map((x) => (
            <article key={x[1]}>
              <span>{x[0]}</span>
              <p>
                <strong>{x[1]}</strong>
                <small>{x[2]}</small>
              </p>
            </article>
          ))}
        </section>
        <section className="how-it-works">
          <span>HOW IT WORKS</span>
          <h2>
            Protection in <em>3 Simple Steps</em>
          </h2>
          <div>
            {[
              [
                "1",
                "☷",
                "Choose Your Plan",
                "Explore and compare plans that suit your needs.",
              ],
              [
                "2",
                "☂",
                "Buy with Confidence",
                "Quick, secure and hassle-free purchase.",
              ],
              [
                "3",
                "♢",
                "Get Protected & Earned",
                "Stay protected while we've got your back.",
              ],
            ].map((step) => (
              <article key={step[0]}>
                <b>{step[1]}</b>
                <i>{step[0]}</i>
                <h3>{step[2]}</h3>
                <p>{step[3]}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="product-section">
          <span>OUR PRODUCTS</span>
          <h2>
            Insurance for <em>Every Need</em>
          </h2>
          <div>
            {products.map((p) => (
              <article key={p.slug}>
                <b>{p.icon}</b>
                <h3>{p.name}</h3>
                <p>{p.copy}</p>
                <Link href={`/products/${p.slug}`}>Explore Plans →</Link>
              </article>
            ))}
          </div>
        </section>
        <section className="claim-banner">
          <b>♧</b>
          <div>
            <h2>Claim Support, Whenever You Need</h2>
            <p>
              Filing a claim is simple with MagikPolicy. Our support team helps
              at every step.
            </p>
          </div>
          <Link className="site-gradient" href="/claims">
            Raise a Claim →
          </Link>
        </section>
        <section className="testimonials">
          <span>WHAT OUR CUSTOMERS SAY</span>
          <div>
            {[
              ["AS", "Amit Sharma"],
              ["NG", "Neha Gupta"],
              ["RK", "Raj Kumar"],
            ].map((person) => (
              <article key={person[0]}>
                <b>{person[0]}</b>
                <h3>{person[1]}</h3>
                <i>★★★★★</i>
                <p>
                  MagikPolicy made comparing and buying the right plan simple,
                  transparent and quick. Highly recommended!
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="partner-banner">
          <div>
            <h2>Become a Partner &amp; Grow Your Business</h2>
            <p>Join thousands of partners and earn attractive rewards.</p>
          </div>
          <Link href="/partner/register">Join as a Partner →</Link>
        </section>
      </main>
    </div>
  );
}
