"use client";
import Image from "next/image";
import Link from "next/link";
import { FormEvent } from "react";
import { SiteFooter, SiteHeader } from "./site-shell";
const benefits = [
  [
    "▥",
    "High Earning Potential",
    "Earn attractive commissions on every policy you sell with no limit on your earning potential.",
  ],
  [
    "♢",
    "50+ Insurance Products",
    "Offer a wide range of insurance solutions from leading insurance companies under one roof.",
  ],
  [
    "ϟ",
    "Quick & Easy Process",
    "Simple onboarding and hassle-free policy issuance for you and your customers.",
  ],
  [
    "▣",
    "Real-time Tracking",
    "Track your leads, policies and commissions in real-time through our partner dashboard.",
  ],
  [
    "◈",
    "Marketing Support",
    "Get marketing materials, training and expert guidance to grow your insurance business.",
  ],
  [
    "♧",
    "Dedicated Partner Support",
    "Our partner support team is always available to help you at every step.",
  ],
];
export function PartnerMarketing() {
  function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    location.href = `/partner/register?email=${encodeURIComponent(String(form.get("email") || ""))}&mobile=${encodeURIComponent(String(form.get("mobile") || ""))}`;
  }
  return (
    <div className="public-site partner-marketing">
      <SiteHeader />
      <main>
        <p className="partner-crumb">
          <Link href="/">Home</Link> › For Partners
        </p>
        <section className="partner-hero">
          <div className="partner-hero-copy">
            <span>✦ Partner with MagikPolicy</span>
            <h1>
              Earn More.
              <br />
              Grow Your Business.
              <br />
              <em>Build Trust.</em> ✦
            </h1>
            <p>
              Join thousands of partners across India who are earning attractive
              commissions by helping customers protect what matters most.
            </p>
            <div>
              <b>
                ♢{" "}
                <small>
                  Trusted Plans
                  <br />
                  from Top Insurers
                </small>
              </b>
              <b>
                ⌘{" "}
                <small>
                  High Commission
                  <br />
                  on Every Policy
                </small>
              </b>
              <b>
                ♧{" "}
                <small>
                  Dedicated Support
                  <br />
                  Always with You
                </small>
              </b>
            </div>
          </div>
          <div className="partner-visual">
            <i>M</i>
            <Image
              src="/brand/magikpolicy-partners-hero.png"
              alt="Successful MagikPolicy insurance partners"
              width={1024}
              height={1536}
              priority
            />
          </div>
          <form className="partner-register-card" onSubmit={register}>
            <h2>Become a Partner</h2>
            <p>Fill in your details to get started</p>
            <label>
              Full Name
              <input name="name" required placeholder="Enter your full name" />
            </label>
            <label>
              Mobile Number
              <input
                name="mobile"
                required
                inputMode="tel"
                pattern="[0-9+ ]{10,15}"
                placeholder="Enter 10 digit mobile number"
              />
            </label>
            <label>
              Email Address
              <input
                name="email"
                type="email"
                required
                placeholder="Enter your email address"
              />
            </label>
            <label>
              City
              <input name="city" required placeholder="Enter your city" />
            </label>
            <label>
              Business Type
              <select name="businessType" required defaultValue="">
                <option value="" disabled>
                  Select business type
                </option>
                <option>Individual Advisor</option>
                <option>Insurance Agency</option>
                <option>Financial Consultant</option>
                <option>Corporate Partner</option>
              </select>
            </label>
            <label className="terms">
              <input type="checkbox" required />I agree to the Terms &amp;
              Conditions and Privacy Policy
            </label>
            <button className="site-gradient">Register Now</button>
            <small>
              Already a partner?{" "}
              <Link href="/login">Login here</Link>
            </small>
          </form>
        </section>
        <section className="partner-section">
          <h2>Why Partner with MagikPolicy?</h2>
          <div className="partner-benefits">
            {benefits.map((item) => (
              <article key={item[1]}>
                <b>{item[0]}</b>
                <div>
                  <h3>{item[1]}</h3>
                  <p>{item[2]}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <NetworkEarnings />
        <section className="partner-process">
          <h2>How It Works</h2>
          <div>
            {[
              [
                "1",
                "♙",
                "Register",
                "Sign up and complete your partner profile",
              ],
              [
                "2",
                "▤",
                "Get Trained",
                "Learn about products and how to sell effectively",
              ],
              [
                "3",
                "♙",
                "Share & Sell",
                "Recommend the right plans to your customers",
              ],
              [
                "4",
                "▣",
                "Policy Issued",
                "Customer gets policy and you earn commission",
              ],
              [
                "5",
                "₹",
                "Earn & Grow",
                "Track earnings and grow your business",
              ],
            ].map((step) => (
              <article key={step[0]}>
                <i>{step[0]}</i>
                <b>{step[1]}</b>
                <h3>{step[2]}</h3>
                <p>{step[3]}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="partner-section">
          <h2>What Our Partners Say</h2>
          <div className="partner-testimonials">
            {[
              ["AS", "Amit Sharma", "Jaipur"],
              ["NG", "Neha Gupta", "Lucknow"],
              ["RK", "Raj Kumar", "Indore"],
            ].map((person) => (
              <article key={person[0]}>
                <q>
                  MagikPolicy has helped me grow my business with a simple
                  process, timely payouts and dedicated support.
                </q>
                <div>
                  <b>{person[0]}</b>
                  <p>
                    <strong>{person[1]}</strong>
                    <small>Partner, {person[2]}</small>
                  </p>
                  <i>★★★★★</i>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="partner-faq partner-section">
          <h2>Frequently Asked Questions</h2>
          <div>
            {[
              [
                "How do I become a partner?",
                "Complete the registration form, verify your email or mobile, submit KYC and bank details, and wait for approval.",
              ],
              [
                "What documents are required?",
                "PAN, Aadhaar and settlement bank details are required for verification.",
              ],
              [
                "Is there any registration fee?",
                "There is currently no fee to submit a MagikPolicy partner application.",
              ],
              [
                "How can I track my earnings?",
                "Approved partners can track policies, commissions and payouts in their dashboard.",
              ],
              [
                "How will I get paid?",
                "Eligible commission is settled to your verified bank account according to the payout cycle.",
              ],
              [
                "Who can become a partner?",
                "Insurance advisors, agencies, financial professionals and eligible individuals may apply.",
              ],
            ].map((item) => (
              <details key={item[0]}>
                <summary>{item[0]}</summary>
                <p>{item[1]}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="partner-cta">
          <div>
            <h2>Ready to Start Your Journey with MagikPolicy?</h2>
            <p>
              Join our partner network today and unlock new earning
              opportunities.
            </p>
          </div>
          <a
            href="#register"
            onClick={(event) => {
              event.preventDefault();
              document
                .querySelector(".partner-register-card")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Become a Partner →
          </a>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function NetworkEarnings() {
  const levelOne = ["Partner 1", "Partner 2", "Partner 3"];
  const levelTwo = ["P1-A", "P1-B", "P2-A", "P2-B", "P3-A", "P3-B"];
  return (
    <section className="network-earnings">
      <header>
        <span>♧</span>
        <div>
          <h2>Build Your Network &amp; <em>Earn More</em></h2>
          <p>
            Invite partners under you and earn additional <strong>monthly commission</strong> on the eligible business they generate.
          </p>
        </div>
      </header>
      <div className="network-earnings-grid">
        <div className="network-tree" aria-label="Two-level partner network">
          <img src="/partner-network.png" alt="Network Partners"></img>
          {/* <div className="network-owner"><span>♙</span><p><strong>YOU</strong><small>Network Partner</small></p></div>
          <div className="network-level network-level-one"><aside><b>Level 1</b><strong>Direct Partners</strong><em>2% Commission</em></aside><div>{levelOne.map(name=><span key={name}><i>♟</i><small>{name}</small></span>)}</div></div>
          <div className="network-level network-level-two"><aside><b>Level 2</b><strong>Partners of Your Level 1</strong><em>0.5% Commission</em></aside><div>{levelTwo.map(name=><span key={name}><i>♟</i><small>{name}</small></span>)}</div></div> */}
        </div>
        <div className="network-rate-card">
          <h3>Your Earnings on Your Network&apos;s Business <span>₹</span></h3>
          <div className="network-rate-head"><b>Level</b><b>Your Network</b><b>You Earn Monthly</b></div>
          <div className="network-rate-row"><strong>Level 1</strong><p><b>Direct Partners</b><small>People you invite</small></p><em>2%<small>of eligible business</small></em></div>
          <div className="network-rate-row level-two"><strong>Level 2</strong><p><b>Partners of Your Level 1</b><small>Their network</small></p><em>0.5%<small>of eligible business</small></em></div>
          <footer>ⓘ Commission is calculated on eligible business generated by your network.</footer>
        </div>
      </div>
      <div className="network-benefit-strip">
        <span className="network-trophy">🏆</span>
        <p><i>▣</i><strong>No Limits</strong><small>There is no limit on how big your network can grow.</small></p>
        <p><i>▥</i><strong>Monthly Payouts</strong><small>Earn every month as your network grows.</small></p>
        <p><i>♢</i><strong>Trusted Platform</strong><small>Transparent payouts on eligible business.</small></p>
      </div>
      <div className="network-growth-banner">↗ <strong>Your network grows. Their business grows. <em>Your income grows!</em></strong></div>
    </section>
  );
}
