"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  authenticatedDestination,
  signInWithGoogle,
  supabaseAuth,
} from "@/lib/supabase-client";
import {
  BadgeCheck,
  BarChart3,
  CalendarDays,
  ChevronRight,
  ClipboardPlus,
  Coins,
  FileText,
  Headphones,
  Lightbulb,
  Quote,
  ShieldCheck,
  TrendingUp,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
const benefits = [
  [
    "▥",
    "High Earning Potential",
    "Earn attractive rewards on every policy you sell with no limit on your earning potential.",
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
    "Track your leads, policies and rewards in real-time through our partner dashboard.",
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
  const [socialError, setSocialError] = useState("");

  useEffect(() => {
    supabaseAuth.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const destination = await authenticatedDestination(data.session.access_token, "partner");
      if (destination) location.replace(destination);
    });
  }, []);

  async function googleRegistration() {
    setSocialError("");
    try {
      const session = await signInWithGoogle(
        `${location.origin}/partner/register?account=1`,
      );
      const destination = await authenticatedDestination(session.access_token, "partner");
      if (destination) return location.replace(destination);
      const response = await fetch("/api/partner/onboarding/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || "Partner registration failed.");
      location.replace("/partner/complete-profile");
    } catch (caught) {
      setSocialError(
        caught instanceof Error
          ? caught.message
          : "Google registration could not be started.",
      );
    }
  }

  return (
    <div className="public-site partner-marketing">
      <main>
        {/* <p className="partner-crumb">
          <Link href="/">Home</Link> › For Partners
        </p> */}
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
              rewards by helping customers protect what matters most.
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
                  High Reward
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
          <section className="partner-register-card mp-form">
            <h2>Become a Partner</h2>
            <p>Use your Google account to get started securely.</p>
            <nav className="mp-auth-tabs" aria-label="Partner authentication">
              <Link
                className="active"
                href="/partner/register"
                aria-current="page"
              >
                Register
              </Link>
              <Link href="/partner/login">Login</Link>
            </nav>
            <button
              className="partner-google"
              type="button"
              onClick={googleRegistration}
            >
              <b>G</b> Continue with Google
            </button>
            {socialError && (
              <p className="partner-error mp-form-error">{socialError}</p>
            )}
          </section>
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
        <PartnerGrowthProgram />
        <PartnerJourney />
        <section className="partner-process legacy-partner-section">
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
                "Customer gets policy and you earn reward",
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
        <section className="partner-section legacy-partner-section">
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
                "Approved partners can track policies, rewards and payouts in their dashboard.",
              ],
              [
                "How will I get paid?",
                "Eligible reward is settled to your verified bank account according to the payout cycle.",
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
          <h2>
            Build Your Network &amp; <em>Earn More</em>
          </h2>
          <p>
            Invite partners under you and earn additional{" "}
            <strong>monthly reward</strong> on the eligible business they
            generate.
          </p>
        </div>
      </header>
      <div className="network-earnings-grid">
        <div className="network-tree" aria-label="Two-level partner network">
          <img src="/partner-network.png" alt="Network Partners"></img>
          {/* <div className="network-owner"><span>♙</span><p><strong>YOU</strong><small>Network Partner</small></p></div>
          <div className="network-level network-level-one"><aside><b>Level 1</b><strong>Direct Partners</strong><em>2% Reward</em></aside><div>{levelOne.map(name=><span key={name}><i>♟</i><small>{name}</small></span>)}</div></div>
          <div className="network-level network-level-two"><aside><b>Level 2</b><strong>Partners of Your Level 1</strong><em>0.5% Reward</em></aside><div>{levelTwo.map(name=><span key={name}><i>♟</i><small>{name}</small></span>)}</div></div> */}
        </div>
        <div className="network-rate-card">
          <h3>
            Your Earnings on Your Network&apos;s Business <span>₹</span>
          </h3>
          <div className="network-rate-head">
            <b>Level</b>
            <b>Your Network</b>
            <b>You Earn Monthly</b>
          </div>
          <div className="network-rate-row">
            <strong>Level 1</strong>
            <p>
              <b>Direct Partners</b>
              <small>People you invite</small>
            </p>
            <em>
              2%<small>of eligible business</small>
            </em>
          </div>
          <div className="network-rate-row level-two">
            <strong>Level 2</strong>
            <p>
              <b>Partners of Your Level 1</b>
              <small>Their network</small>
            </p>
            <em>
              0.5%<small>of eligible business</small>
            </em>
          </div>
          <footer>
            ⓘ Reward is calculated on eligible business generated by your
            network.
          </footer>
        </div>
      </div>
      <div className="network-benefit-strip">
        <span className="network-trophy">🏆</span>
        <p>
          <i>▣</i>
          <strong>No Limits</strong>
          <small>There is no limit on how big your network can grow.</small>
        </p>
        <p>
          <i>▥</i>
          <strong>Monthly Payouts</strong>
          <small>Earn every month as your network grows.</small>
        </p>
        <p>
          <i>♢</i>
          <strong>Trusted Platform</strong>
          <small>Transparent payouts on eligible business.</small>
        </p>
      </div>
      <div className="network-growth-banner">
        ↗{" "}
        <strong>
          Your network grows. Their business grows. <em>Your income grows!</em>
        </strong>
      </div>
    </section>
  );
}

function PartnerGrowthProgram() {
  return (
    <section className="partner-growth">
      <header className="partner-growth-heading">
        <span>Partner Growth Program</span>
        <h2>
          Grow From Partner to <em>Team Leader</em>
        </h2>
        <h3>Sell policies. Build your team. Earn more together.</h3>
        <p>
          Start by selling policies yourself. When you&apos;re ready to grow,
          onboard partners to your team and earn additional monthly reward
          on eligible business generated by them.
        </p>
      </header>

      <div className="partner-growth-steps">
        <GrowthStep
          icon={UserRound}
          number="01"
          title="Start as a Partner"
          copy="Sell policies and earn your regular reward."
          tone="blue"
        />
        <i>›</i>
        <GrowthStep
          icon={UsersRound}
          number="02"
          title="Build Your Team"
          copy="Invite agents/partners and help them grow."
          tone="pink"
        />
        <i>›</i>
        <GrowthStep
          icon={BarChart3}
          number="03"
          title="Unlock Team Earnings"
          copy="As your team generates eligible business, you receive additional monthly reward."
          tone="green"
        />
      </div>

      <div className="partner-growth-details">
        <div className="partner-growth-path">
          <div className="growth-owner">
            <span>
              <UserRound />
            </span>
            <p>
              <strong>YOU</strong>
              <small>Partner / Team Leader</small>
            </p>
          </div>
          <div className="growth-path-branches">
            <article>
              <span>
                <FileText />
              </span>
              <p>
                <strong>Your Business</strong>
                <small>You sell policies</small>
              </p>
              <b>↓</b>
              <em>
                <Coins /> Regular Reward
              </em>
            </article>
            <article>
              <span>
                <UsersRound />
              </span>
              <p>
                <strong>Your Team&apos;s Business</strong>
                <small>Your partners sell policies</small>
              </p>
              <b>↓</b>
              <em>
                <Coins /> Additional Team Reward
              </em>
            </article>
          </div>
        </div>

        <div className="partner-commission-card">
          <header>
            <span>
              <WalletCards />
            </span>
            <h3>Team Reward Structure</h3>
            <small>
              <CalendarDays /> Paid Monthly
            </small>
          </header>
          <article className="direct">
            <span>
              <UsersRound />
            </span>
            <p>
              <strong>Direct Team Partners</strong>
              <small>
                Additional reward on eligible business generated by partners
                directly onboarded by you.
              </small>
            </p>
            <b>2%</b>
          </article>
          <article className="extended">
            <span>
              <UsersRound />
            </span>
            <p>
              <strong>Extended Team</strong>
              <small>
                Additional reward on eligible business generated by
                qualifying partners within your team.
              </small>
            </p>
            <b>0.5%</b>
          </article>
          <footer>
            <Lightbulb />
            <span>
              Support your partners, help them grow, and create a stronger, more
              successful journey together.
            </span>
          </footer>
        </div>
      </div>

      <div className="partner-growth-trust">
        <span>
          <ShieldCheck /> Trusted Insurance Brands
        </span>
        <span>
          <Headphones /> Dedicated Support
        </span>
        <span>
          <UsersRound /> Tools to Help You Grow
        </span>
      </div>
    </section>
  );
}

function PartnerJourney() {
  const steps = [
    {
      icon: ClipboardPlus,
      title: "Register",
      copy: "Sign up and complete your partner profile.",
      tone: "blue",
    },
    {
      icon: BadgeCheck,
      title: "Sell Policies",
      copy: "Help customers choose the right policy and earn your regular reward.",
      tone: "green",
    },
    {
      icon: UsersRound,
      title: "Build Your Team",
      copy: "Onboard agents/partners and support them in growing their business.",
      tone: "orange",
    },
    {
      icon: TrendingUp,
      title: "Earn More",
      copy: "Get additional monthly reward on eligible business generated by your team.",
      tone: "pink",
    },
  ];
  const stories = [
    {
      initials: "AS",
      name: "Amit Sharma",
      city: "Jaipur",
      tone: "blue",
      quote:
        "MagikPolicy has given me a great platform to grow my business and earn consistent monthly income. The support team is always with us.",
    },
    {
      initials: "NG",
      name: "Neha Gupta",
      city: "Lucknow",
      tone: "pink",
      quote:
        "I love the additional team reward. As my partners grow, my earnings also grow. It’s a great opportunity for serious partners.",
    },
    {
      initials: "RK",
      name: "Raj Kumar",
      city: "Indore",
      tone: "green",
      quote:
        "Easy to use platform, wide range of products and timely payouts. Highly recommended!",
    },
  ];
  return (
    <section className="partner-journey">
      <header className="journey-heading">
        <span>Simple Steps to Grow</span>
        <h2>How It Works</h2>
        <i />
        <p>
          From registration to higher earnings — your growth journey is simple
          and rewarding.
        </p>
      </header>
      <div className="journey-steps">
        {steps.map(({ icon: Icon, title, copy, tone }, index) => (
          <div className="journey-step-wrap" key={title}>
            <article className={`journey-step ${tone}`}>
              <i>{index + 1}</i>
              <span>
                <Icon />
              </span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
            {index < steps.length - 1 && (
              <b>
                <ChevronRight />
              </b>
            )}
          </div>
        ))}
      </div>
      <header className="journey-heading testimonial-heading">
        <span>Real Stories. Real Growth</span>
        <h2>What Our Partners Say</h2>
        <p>Hear from our partners who are growing their business with us.</p>
      </header>
      <div className="journey-testimonials">
        {stories.map((story) => (
          <article className={story.tone} key={story.name}>
            <Quote />
            <q>{story.quote}</q>
            <footer>
              <b>{story.initials}</b>
              <p>
                <strong>{story.name}</strong>
                <small>Partner, {story.city}</small>
              </p>
              <i aria-label="5 out of 5 stars">★★★★★</i>
            </footer>
          </article>
        ))}
      </div>
      <div className="testimonial-dots">
        <i />
        <i />
        <i />
      </div>
    </section>
  );
}

function GrowthStep({
  icon: Icon,
  number,
  title,
  copy,
  tone,
}: {
  icon: typeof UserRound;
  number: string;
  title: string;
  copy: string;
  tone: string;
}) {
  return (
    <article className={`growth-step ${tone}`}>
      <span>
        <Icon />
      </span>
      <div>
        <small>{number}</small>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
    </article>
  );
}
