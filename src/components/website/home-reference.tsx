"use client";

import Image from "next/image";
import { QuotationModal } from "./quotation-modal";
import Link from "next/link";
import {
  useEffect,
  useState,
  type ComponentType,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Baby,
  Bike,
  Calculator,
  CarFront,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CloudLightning,
  FileCheck2,
  Gavel,
  Headphones,
  HeartPulse,
  IndianRupee,
  Laptop,
  LockKeyhole,
  Plane,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Umbrella,
  UserRound,
  UsersRound,
  WalletCards,
  X,
  Zap,
} from "lucide-react";

type IconType = ComponentType<{ className?: string }>;
type Option = { label: string; icon?: IconType };
const tabs: Array<[string, IconType, string]> = [
  ["health", HeartPulse, "Health"],
  ["motor", CarFront, "Motor"],
  ["term", ShieldCheck, "Term Life"],
];

const productFields: Record<
  string,
  Array<{ key: string; label: string; options: Option[] }>
> = {
  health: [
    {
      key: "policyFor",
      label: "I want a policy for",
      options: [
        { label: "Self", icon: UserRound },
        { label: "My Family", icon: UsersRound },
        { label: "My Parents", icon: UserRound },
        // { label: "My Child", icon: Baby },
      ],
    },
    {
      key: "coverage",
      label: "Select Coverage Amount",
      options: ["₹7 Lakhs", "₹15 Lakhs", "₹25 Lakhs", "₹50 Lakhs", "₹1 Crore+"].map(
        (label) => ({ label }),
      ),
    },
  ],
  motor: [
    {
      key: "vehicleType",
      label: "Select Vehicle Type",
      options: [
        { label: "Car", icon: CarFront },
        { label: "Bike", icon: Bike },
        { label: "Commercial", icon: WalletCards },
      ],
    },
    {
      key: "planType",
      label: "Select Motor Cover",
      options: ["Comprehensive", "Third Party", "Own Damage"].map(
        (label) => ({ label }),
      ),
    },
  ],
  term: [
    {
      key: "insuredFor",
      label: "Life cover required for",
      options: [
        { label: "Self", icon: UserRound },
        { label: "Spouse", icon: UsersRound },
      ],
    },
    {
      key: "coverage",
      label: "Select Life Cover",
      options: ["₹50 Lakhs", "₹1 Crore", "₹2 Crore", "₹5 Crore"].map(
        (label) => ({ label }),
      ),
    },
  ],
};

function defaultSelections(tab: string) {
  return Object.fromEntries(
    productFields[tab].map((field) => [field.key, field.options[0].label]),
  );
}

function ChoiceGrid({
  items,
  value,
  set,
  columns,
}: {
  items: Option[];
  value: string;
  set: (value: string) => void;
  columns: string;
}) {
  return (
    <div className={`quote-choice-grid grid gap-3 ${columns}`}>
      {items.map(({ label, icon: Icon }) => {
        const active = value === label;
        return (
          <button
            type="button"
            key={label}
            onClick={() => set(label)}
            className={`relative flex min-h-[62px] min-w-0 items-center justify-center gap-3 rounded-lg border px-2 text-sm font-medium ${active ? "border-violet-600 bg-[var(--appearance-surface-raised,#f5f3ff)] text-[var(--appearance-violet,#6d28d9)]" : "border-[var(--appearance-border,#e2e8f0)] bg-[var(--appearance-surface,#fff)] text-[var(--appearance-text,#334155)]"}`}
          >
            {Icon && <Icon className="h-6 w-6" />}
            {label}
            {active && (
              <i className="absolute -right-px -top-px grid h-5 w-5 place-items-center rounded-bl-xl rounded-tr-lg bg-violet-700 text-white">
                <Check className="h-3 w-3" />
              </i>
            )}
          </button>
        );
      })}
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="mb-10 border-0 p-0">
      <legend className="mb-5 text-xl font-semibold text-[var(--appearance-text,#111c4e)] max-2xl:text-base">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}

function QuoteFinder() {
  const [tab, setTab] = useState("health");
  const [selections, setSelections] = useState<Record<string, string>>(() => ({
    ...defaultSelections("health"),
    coverage: "₹10 Lakhs",
  }));
  const [contactStep, setContactStep] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function selectTab(nextTab: string) {
    setTab(nextTab);
    setSelections(defaultSelections(nextTab));
    setContactStep(false);
    setSuccess(false);
    setError("");
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/public/quote-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productType: tab,
          customerName,
          mobile,
          selections,
          website: "",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to submit request");
      setSuccess(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--appearance-border,#ebeaf4)] bg-[var(--appearance-surface,#fff)] shadow-[0_16px_45px_rgba(44,37,105,.08)]">
      <div className="quote-tabs-responsive grid h-[84px] grid-cols-3 border-b border-[var(--appearance-border,#ecebf4)]">
        {tabs.map(([id, Icon, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            className={`flex min-w-0 items-center justify-center gap-5 border-0 bg-[var(--appearance-surface,#fff)] text-base font-medium max-md:gap-2 max-md:text-sm ${tab === id ? "border-b-[3px] border-b-violet-600 bg-[var(--appearance-surface-raised,#f5f3ff)]/60 text-[var(--appearance-violet,#6d28d9)]" : "text-[var(--appearance-text,#111c4e)]"}`}
          >
            <Icon className="h-6 w-6" />
            {label}
          </button>
        ))}
      </div>
      <div className="px-5 pb-5 pt-10 max-2xl:pt-8 max-md:px-3 max-md:pb-3 max-md:pt-6">
        {success ? (
          <div className="grid min-h-[270px] place-items-center text-center">
            <div>
              <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
              <h2 className="mb-2 mt-4 text-2xl text-[var(--appearance-text,#111c4e)]">
                Successfully submitted!
              </h2>
              <p className="m-0 text-sm text-[var(--appearance-muted,#475569)]">
                Thank you. Our insurance expert will contact you shortly.
              </p>
            </div>
          </div>
        ) : contactStep ? (
          <form className="grid min-h-[270px] content-center gap-4" onSubmit={submitRequest}>
            <h2 className="m-0 text-xl text-[var(--appearance-text,#111c4e)]">Enter your details</h2>
            <input
              required
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="h-14 rounded-lg border border-slate-300 px-4 text-sm outline-none focus:border-violet-600"
              placeholder="Full name"
              autoComplete="name"
            />
            <input
              required
              value={mobile}
              onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))}
              className="h-14 rounded-lg border border-slate-300 px-4 text-sm outline-none focus:border-violet-600"
              placeholder="10-digit mobile number"
              inputMode="numeric"
              autoComplete="tel"
              pattern="[6-9][0-9]{9}"
            />
            <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
            {error && <p className="m-0 text-sm text-red-600">{error}</p>}
            <div className="grid grid-cols-[auto_1fr] gap-3">
              <button
                type="button"
                onClick={() => setContactStep(false)}
                className="h-[54px] rounded-lg border border-violet-500 bg-[var(--appearance-surface,#fff)] px-5 text-sm text-[var(--appearance-violet,#6d28d9)]"
              >
                Back
              </button>
              <button
                disabled={submitting}
                className="flex h-[54px] items-center justify-center gap-3 rounded-lg border-0 bg-gradient-to-r from-[#4b12f0] via-[#a32ba6] to-[#ff570d] text-base font-medium text-white disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Request"}
                {!submitting && <ArrowRight className="h-5 w-5" />}
              </button>
            </div>
          </form>
        ) : (
          <>
            {productFields[tab].map((field) => (
              <Field label={field.label} key={field.key}>
                <ChoiceGrid
                  items={field.options}
                  value={selections[field.key]}
                  set={(value) =>
                    setSelections((current) => ({
                      ...current,
                      [field.key]: value,
                    }))
                  }
                  columns={
                    field.options.length >= 5
                      ? "grid-cols-5 max-lg:grid-cols-3"
                      : field.options.length === 4
                        ? "grid-cols-4 max-[520px]:grid-cols-2"
                        : "grid-cols-3 max-[520px]:grid-cols-1"
                  }
                />
              </Field>
            ))}
            <button
              type="button"
              onClick={() => setContactStep(true)}
              className="btn-primary flex h-[54px] w-full items-center justify-center gap-4 rounded-lg border-0 bg-gradient-to-r from-[#4b12f0] via-[#a32ba6] to-[#ff570d] text-base font-medium text-white"
            >
              View Plans <ArrowRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const statItems: Array<[IconType, string, string, string]> = [
  [
    UsersRound,
    "50+",
    "Insurance Partners",
    "Top insurance companies you can trust",
  ],
  [
    ShieldCheck,
    "100+",
    "Insurance Products",
    "Wide range of policies to choose from",
  ],
  // [UsersRound, "2L+", "Policies Sold", "Trusted by lakhs of happy customers"],
  [Star, "4.8/5", "Customer Rating", "Rated excellent by partners & customers"],
  [
    IndianRupee,
    "High",
    "Partner Earnings",
    "Earn attractive rewards on every sale",
  ],
];
function Stats() {
  return (
    <section className="home-stats grid grid-cols-4 rounded-xl border border-[var(--appearance-border,#e2e8f0)] bg-violet-100 p-5 shadow-sm max-lg:grid-cols-4 max-md:grid-cols-2 max-md:p-2">
      {statItems.map(([Icon, value, label, copy], i) => (
        <article
          key={label}
          className={`${i === 4 ? "max-lg:hidden" : ""} flex gap-3 border-r border-[var(--appearance-border,#e2e8f0)] px-4 last:border-0 max-md:items-center max-md:border-b max-md:border-r-0 max-md:px-2 max-md:py-4`}
        >
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${i === 1 ? "bg-emerald-50 text-emerald-500" : i === 2 ? "bg-pink-50 text-pink-500" : i === 3 ? "bg-amber-50 text-amber-500" : "bg-[var(--appearance-surface-raised,#f5f3ff)] text-[var(--appearance-violet,#7c3aed)]"}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <strong className="block text-lg text-[var(--appearance-text,#0b174c)]">{value}</strong>
            <b className="block text-[13x] text-[var(--appearance-text,#182653)]">{label}</b>
            <small className="mt-1 block text-[12px] leading-relaxed text-[var(--appearance-muted,#64748b)]">
              {copy}
            </small>
          </div>
        </article>
      ))}
    </section>
  );
}

const miniBenefits: Array<[IconType, string, string]> = [
  [Target, "No Target", "Earn from the first policy"],
  [
    ShieldCheck,
    "Every Policy Counts",
    "Extra on every eligible policy you sell",
  ],
  [
    Calculator,
    "Company-wise Calculation",
    "Automatically calculated as per insurer & product",
  ],
];
function PartnerEarning() {
  return (
    <section className="partner-earning-responsive grid grid-cols-[.9fr_1.1fr] items-center gap-10 rounded-2xl border border-slate-100 bg-[var(--appearance-surface,#fff)] p-10 shadow-sm max-lg:grid-cols-1 max-md:gap-7 max-md:p-5">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--appearance-surface-raised,#f5f3ff)] px-3 py-1 text-[10px] font-bold text-[var(--appearance-violet,#6d28d9)]">
          <UsersRound className="h-4 w-4" /> PARTNER WITH US
        </span>
        <h2 className="mb-3 mt-4 text-4xl leading-tight text-[var(--appearance-text,#0b174c)] max-md:text-3xl">
          Join MagikPolicy &amp;
          <br />
          Earn{" "}
          <em className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text not-italic text-transparent">
             Extra!
          </em>
        </h2>
        <p className="max-w-lg text-sm leading-relaxed text-[var(--appearance-muted,#475569)]">
          Already earning working as an insurance agent? Switch to
          MagikPolicy and get extra rewards on every eligible policy.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4">
          {miniBenefits.map(([Icon, title, copy]) => (
            <article
              key={title}
              className="border-r border-[var(--appearance-border,#e2e8f0)] pr-3 last:border-0"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-500">
                <Icon className="h-8 w-8" />
              </span>
              <b className="mt-2 block text-sm text-[var(--appearance-text,#122050)]">{title}</b>
              <small className="mt-1 block text-[12px] leading-relaxed text-[var(--appearance-muted,#64748b)]">
                {copy}
              </small>
            </article>
          ))}
        </div>
      </div>
      <div className="earning-image-responsive flex w-full min-w-0 max-w-full items-center justify-center overflow-hidden px-0 max-md:px-1">
        <Image
          src="/brand/magikpolicy-extra-earning.png"
          alt="Example showing current rewards of 10,000 points plus up to 2,000 points MagikPolicy extra rewards equals up to 12,000 points total earning"
          width={794}
          height={499}
          className="block h-auto w-full min-w-0 max-w-[794px] object-contain max-lg:max-w-[680px] max-md:max-w-full"
          sizes="(max-width: 640px) calc(100vw - 48px), (max-width: 1024px) min(680px, calc(100vw - 80px)), 52vw"
        />
      </div>
      <div className="col-span-2 grid grid-cols-4 gap-3 max-lg:col-span-1 max-md:grid-cols-2 bg-[var(--appearance-surface-raised,#f5f3ff)] p-4 border-0 rounded-lg  ">
        {[
          [TrendingUp, "Increase Your Earnings", "Do less get more"],
          [IndianRupee, "No Deductions", "No hidden charges"],
          [Headphones, "Dedicated Partner Support", "We are here to help"],
          [ShieldCheck, "Grow Your Business", "Access insurers & products"],
        ].map(([Icon, title, copy]) => (
          <article
            className="flex gap-3 rounded-xl border border-[var(--appearance-border,#e2e8f0)] p-4"
            key={String(title)}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--appearance-surface-raised,#f5f3ff)] text-[var(--appearance-violet,#7c3aed)]">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <b className="block text-md pb-1 text-[var(--appearance-text,#122050)]">{String(title)}</b>
              <small className="text-[13px] text-[var(--appearance-muted,#64748b)]">
                {String(copy)}
              </small>
            </div>
          </article>
        ))}
      </div>
      <div className="col-span-2 flex justify-center gap-4 max-lg:col-span-1 max-md:flex-col mt-5">
        {/* <Link
          className="flex min-h-12 min-w-72 items-center justify-center gap-3 rounded-lg border border-violet-500 px-5 text-sm font-semibold text-[var(--appearance-violet,#6d28d9)] bg-[var(--appearance-surface-raised,#f5f3ff)]"
          href="/products"
        >
          Check My Extra Earning <ArrowRight className="h-4 w-4" />
        </Link> */}
        <Link
          className="btn-primary flex min-h-12 min-w-72 items-center justify-center gap-4 rounded-lg bg-gradient-to-r from-violet-700 via-fuchsia-600 to-orange-500 px-5 text-sm font-semibold text-white"
          href="/partner/register"
        >
          <UsersRound className="h-5 w-5" />
          Become a MagikPolicy Partner
        </Link>
      </div>
    </section>
  );
}

const plans: Array<[IconType, string, string, string, string]> = [
  [
    HeartPulse,
    "Health Insurance",
    "Quality healthcare for you & your family",
    "₹458",
    "month",
  ],
  [
    CarFront,
    "Car Insurance",
    "Comprehensive cover for your car",
    "₹1,094",
    "year",
  ],
  [Bike, "Bike Insurance", "Secure your ride instantly", "₹457", "year"],
  [
    ShieldCheck,
    "Term Insurance",
    "High life cover at low premiums",
    "₹373",
    "month",
  ],
  [Plane, "Travel Insurance", "Travel worry-free anywhere", "₹154", "trip"],
  [
    Umbrella,
    "Personal Accident",
    "Financial protection against accidents",
    "₹179",
    "trip",
  ],
];
const popularPlanProducts: Record<string,string> = {"Health Insurance":"health","Car Insurance":"car","Bike Insurance":"bike","Term Insurance":"term","Travel Insurance":"travel","Personal Accident":"personal-accident"};
function PopularPlans() {
  const [quoteProduct,setQuoteProduct]=useState<string | null>(null);
  return (
    <section>
      <header className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl text-[var(--appearance-text,#0b174c)]">Popular Insurance Plans</h2>
        <Link
          className="flex items-center gap-2 text-xs font-semibold text-[var(--appearance-violet,#6d28d9)]"
          href="/products"
        >
          View All Plans <ArrowRight className="h-4 w-4" />
        </Link>
      </header>
      <div className="grid grid-cols-6 gap-4 max-xl:grid-cols-3 max-md:grid-cols-2">
        {plans.map(([Icon, title, copy, price, unit]) => (
          <article
            className="rounded-xl border border-[var(--appearance-border,#e2e8f0)] bg-[var(--appearance-surface,#fff)] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            key={title}
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--appearance-surface-raised,#f5f3ff)] text-[var(--appearance-violet,#7c3aed)]">
              <Icon className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-sm text-[var(--appearance-text,#102050)]">{title}</h3>
            <p className="min-h-10 text-[14px] leading-relaxed text-[var(--appearance-muted,#64748b)]">
              {copy}
            </p>
            <small className="text-[10px] font-semibold text-slate-400">Starting from</small>
            <strong className="mt-1 block text-base text-[var(--appearance-text,#0b174c)] text-[22px]">
              {price}
              <small className="font-normal"> /{unit}</small>
            </strong>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={()=>setQuoteProduct(popularPlanProducts[title])}
              className="border-0 bg-transparent p-0 cursor-pointer mt-5 flex items-center gap-1 text-[12px] font-semibold text-emerald-500"
            >
              Get Plan Details <ArrowRight className="h-3 w-3" />
            </button>
          </article>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-4 rounded-xl border border-[var(--appearance-border,#e2e8f0)] bg-[var(--appearance-surface,#fff)] p-4 max-md:grid-cols-2">
        {[
          [ShieldCheck, "100% Secure", "Your data is safe with us"],
          [Target, "Best Prices", "Compare & save more"],
          [Headphones, "Quick Support", "We're here for you"],
          [CheckCircle2, "Claim Assistance", "Hassle-free claims"],
        ].map(([Icon, title, copy]) => (
          <div
            className="flex items-center justify-center gap-3 px-3"
            key={String(title)}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--appearance-surface-raised,#f5f3ff)] text-[var(--appearance-violet,#7c3aed)]">
              <Icon className="h-4 w-4" />
            </span>
            <p>
              <b className="block text-[14px]">{String(title)}</b>
              <small className="text-[12px] text-[var(--appearance-muted,#64748b)]">
                {String(copy)}
              </small>
            </p>
          </div>
        ))}
      </div>
      {quoteProduct && <QuotationModal productType={quoteProduct} close={()=>setQuoteProduct(null)} />}
    </section>
  );
}

function ClaimHelpModal({ close }: { close: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError("");
    const response = await fetch("/api/public/claim-help", { method: "POST", body: new FormData(event.currentTarget) });
    const body = await response.json(); setSubmitting(false);
    if (!response.ok) return setError(body.error || "Unable to submit your request");
    setSubmitted(true);
  }
  return <div className="claim-help-modal fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#08132f]/60 p-4 backdrop-blur-sm" onMouseDown={close}>
    <section className="relative my-4 w-full max-w-2xl rounded-2xl bg-[var(--appearance-surface,#fff)] p-6 shadow-2xl max-md:p-4" onMouseDown={event => event.stopPropagation()}>
      <button type="button" onClick={close} aria-label="Close claim help form" className="claim-help-close absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border-0 bg-slate-100 text-xl text-[var(--appearance-muted,#475569)]">×</button>
      {submitted ? <div className="grid min-h-72 place-items-center text-center"><div><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500"/><h2 className="mb-2 mt-4 text-2xl text-[var(--appearance-text,#101c50)]">Request submitted successfully!</h2><p className="text-sm text-[var(--appearance-muted,#475569)]">Our claim assistance team will contact you on WhatsApp shortly.</p><button type="button" onClick={close} className="claim-help-primary mt-4 rounded-lg border-0 bg-violet-600 px-6 py-3 text-sm font-semibold text-white">Close</button></div></div> : <>
        <div className="pr-12"><span className="text-xs font-semibold text-[var(--appearance-violet,#7c3aed)]">CLAIM ASSISTANCE</span><h2 className="mb-2 mt-2 text-2xl text-[var(--appearance-text,#101c50)]">Tell us about your failed claim</h2><p className="mt-0 text-sm text-[var(--appearance-muted,#475569)]">Attach both documents as PDF, JPG, PNG or WEBP files up to 5 MB.</p></div>
        <form className="mt-5 grid grid-cols-2 gap-4 max-md:grid-cols-1" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-medium text-[var(--appearance-text,#172454)]">Name<input name="name" required minLength={2} className="h-12 rounded-lg border border-slate-300 px-3 outline-none focus:border-violet-600" placeholder="Your full name"/></label>
          <label className="grid gap-2 text-sm font-medium text-[var(--appearance-text,#172454)]">WhatsApp number<input name="whatsappNumber" required inputMode="tel" pattern="[0-9+ ]{10,16}" className="h-12 rounded-lg border border-slate-300 px-3 outline-none focus:border-violet-600" placeholder="10-digit WhatsApp number"/></label>
          <label className="grid gap-2 text-sm font-medium text-[var(--appearance-text,#172454)]">Claim amount<input name="claimAmount" required type="number" min="1" step="0.01" className="h-12 rounded-lg border border-slate-300 px-3 outline-none focus:border-violet-600" placeholder="₹ Claim amount"/></label>
          <label className="grid gap-2 text-sm font-medium text-[var(--appearance-text,#172454)]">Location<input name="location" required minLength={2} className="h-12 rounded-lg border border-slate-300 px-3 outline-none focus:border-violet-600" placeholder="City, State"/></label>
          
          <label className="grid gap-2 text-sm font-medium text-[var(--appearance-text,#172454)]">Attach policy<input name="policyDocument" required type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="rounded-lg border border-dashed border-violet-300 p-3 text-xs"/></label>
          <label className="grid gap-2 text-sm font-medium text-[var(--appearance-text,#172454)]">Attach failure document<input name="failureDocument" required type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="rounded-lg border border-dashed border-violet-300 p-3 text-xs"/></label>
          <label className="col-span-2 grid gap-2 text-sm font-medium text-[var(--appearance-text,#172454)] max-md:col-span-1">Reason for claim failure<textarea name="reason" required minLength={10} maxLength={1000} className="min-h-24 resize-y rounded-lg border border-slate-300 p-3 outline-none focus:border-violet-600" placeholder="Explain the reason given for rejecting or failing your claim"/></label>
          <input name="website" className="hidden" tabIndex={-1} autoComplete="off"/>
          {error && <p className="col-span-2 m-0 text-sm text-red-600 max-md:col-span-1">{error}</p>}
          <button disabled={submitting} className="claim-help-primary col-span-2 h-12 rounded-lg border-0 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-orange-500 text-sm font-semibold text-white disabled:opacity-60 max-md:col-span-1">{submitting ? "Submitting request…" : "Submit Claim Help Request"}</button>
        </form>
      </>}
    </section>
  </div>;
}

function ClaimBanner() {
  const [open, setOpen] = useState(false);
  return (
    <>
    <section className="grid grid-cols-[1.05fr_.8fr_.8fr] items-center gap-7 rounded-2xl bg-gradient-to-r from-violet-300 via-white to-violet-100 p-8 max-lg:grid-cols-1">
      <div>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-[10px] font-bold text-[var(--appearance-violet,#6d28d9)]">
          CLAIM CONSULTING
        </span>
        <h2 className="mb-2 mt-4 text-3xl text-[var(--appearance-text,#0b174c)]">
          Is your claim failed?
        </h2>
        <h3 className="m-0 text-lg text-[var(--appearance-text,#172454)]">
          Let us know, we will help you to get your claim pass.
        </h3>
        <p className="text-sm leading-relaxed text-[var(--appearance-muted,#475569)]">
          We provide you an advocate who assists and helps you legally to
          approve your claim.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="claim-help-trigger rounded-lg border-0 bg-gradient-to-r from-violet-700 to-pink-500 px-5 py-3 text-xs font-semibold text-white"
          >
            Get Claim Help Now →
          </button>
          {/* <Link
            className="rounded-lg border-2 border-solid border-violet-500 px-5 py-3 text-xs font-semibold text-[var(--appearance-violet,#6d28d9)]"
            href="/resources"
          >
            How It Works
          </Link> */}
        </div>
      </div>
      <div className="relative grid min-h-60 place-items-center">
        {/* <div className="absolute h-48 w-48 rounded-full bg-violet-100" />
        <FileCheck2 className="z-10 h-36 w-36 rotate-6 text-[var(--appearance-violet,#7c3aed)]" />
        <Gavel className="absolute bottom-2 right-5 z-20 h-24 w-24 -rotate-12 text-amber-800" /> */}
        <div className="earning-image-responsive rounded-2xl flex w-full min-w-0 max-w-full items-center justify-center overflow-hidden px-0 max-md:px-1">
          <Image
            src="/brand/claim-failed.png"
            alt="Example showing current rewards of 10,000 points plus up to 2,000 points MagikPolicy extra rewards equals up to 12,000 points total earning"
            width={794}
            height={499}
            className="block h-auto w-full min-w-0 max-w-[794px] object-contain max-lg:max-w-[680px] max-md:max-w-full"
            sizes="(max-width: 640px) calc(100vw - 48px), (max-width: 1024px) min(680px, calc(100vw - 80px)), 52vw"
          />
        </div>
      </div>
      <div className="grid gap-4">
        {[
          [
            Scale,
            "Legal Expert Support",
            "Get help from experienced advocates",
          ],
          [
            UsersRound,
            "Claim Review",
            "We review your case and find the best solution",
          ],
          [
            ShieldCheck,
            "Higher Success Rate",
            "We work to get your claim legally approved",
          ],
        ].map(([Icon, title, copy]) => (
          <article className="flex gap-3" key={String(title)}>
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-violet-100 text-[var(--appearance-violet,#7c3aed)]">
              <Icon className="h-7 w-7" />
            </span>
            <p className="m-0">
              <b className="block text-xs text-[var(--appearance-text,#142151)]">{String(title)}</b>
              <small className="text-[11px] leading-relaxed text-[var(--appearance-muted,#64748b)]">
                {String(copy)}
              </small>
            </p>
          </article>
        ))}
      </div>
    </section>
    {open && <ClaimHelpModal close={() => setOpen(false)} />}
    </>
  );
}

function Testimonials() {
  return (
    <section className="text-center w-4/5 mx-auto">
      <span className="rounded-full bg-[var(--appearance-surface-raised,#f5f3ff)] px-3 py-1 text-[10px] font-bold text-[var(--appearance-violet,#6d28d9)]">
        CUSTOMER TESTIMONIALS
      </span>
      <h2 className="mb-2 mt-4 text-4xl text-[var(--appearance-text,#0b174c)]">
        Trusted by Customers.
        <br />
        <em className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text not-italic text-transparent">
          Loved for the Experience.
        </em>
      </h2>
      <p className="mx-auto max-w-xl text-xs text-[var(--appearance-muted,#64748b)]">
        Hear from people who have experienced hassle-free policy buying, quick
        support and smooth claim assistance with MagikPolicy.
      </p>
      <div className="mt-7 grid grid-cols-[1.1fr_.9fr] gap-4 text-left max-lg:grid-cols-1">
        <article className="rounded-xl border border-[var(--appearance-border,#e2e8f0)] bg-[var(--appearance-surface,#fff)] p-7 shadow-sm">
          <span className="text-6xl leading-none text-violet-200">“</span>
          <p className="text-base font-semibold leading-relaxed text-[var(--appearance-text,#172454)]">
            Buying insurance was never this easy! MagikPolicy helps me compare
            the best policies and I even saved on my premium. The whole process
            is simple, transparent and truly hassle-free.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-200 font-bold">
              RV
            </span>
            <p className="m-0">
              <b className="block text-xs">Rahul Verma</b>
              <small className="text-[9px] text-emerald-500">
                ● Verified Customer
              </small>
            </p>
          </div>
        </article>
        <div className="grid gap-4">
          {[
            [
              "When I had a claim, the support team guided me at every step. The claim was settled quickly and without any stress.",
              "Priya Nair",
            ],
            [
              "I love how easy it is to manage my policies and renewals in one place.",
              "Amit Kapoor",
            ],
          ].map(([quote, name]) => (
            <article
              className="rounded-xl border border-[var(--appearance-border,#e2e8f0)] bg-[var(--appearance-surface,#fff)] p-5 shadow-sm"
              key={name}
            >
              <div className="text-amber-400">★★★★★</div>
              <p className="text-xs font-medium leading-relaxed text-[var(--appearance-text,#172454)]">
                “{quote}”
              </p>
              <b className="text-[10px]">{name}</b>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const advantageCards: Array<[IconType, string, string]> = [
  [
    Laptop,
    "Multiple Insurers",
    "Compare and offer policies from multiple insurance companies",
  ],
  [
    Zap,
    "Quick Policy Access",
    "Find the right product for your customer faster",
  ],
  [
    UsersRound,
    "Customer Management",
    "Keep customers, policies and requirements organized",
  ],
  [
    Clock3,
    "Smart Renewals",
    "Track upcoming renewals and never miss an opportunity",
  ],
  [
    WalletCards,
    "Transparent Earnings",
    "Know your rewards and earnings policy-by-policy",
  ],
  [
    Headphones,
    "Dedicated Support",
    "Get assistance whenever you or your customer needs help",
  ],
];
function Advantage() {
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);

  useEffect(() => {
    if (!partnerModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPartnerModalOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [partnerModalOpen]);

  function submitPartnerApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams({
      email: String(form.get("email") || ""),
      mobile: String(form.get("mobile") || ""),
    });
    window.location.href = `/partner/register?${params.toString()}`;
  }

  return (
    <section className="rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 p-4">
      <div className="grid grid-cols-[1fr_.75fr] items-center gap-7 max-lg:grid-cols-1">
        <div>
          <span className="rounded-full bg-[var(--appearance-surface-raised,#f5f3ff)] px-3 py-1 text-[10px] font-bold text-[var(--appearance-violet,#6d28d9)]">
            SUPER OPPORTUNITY
          </span>
          <h2 className="mb-2 mt-4 text-5xl text-[var(--appearance-text,#0b174c)]">
            The MagikPolicy{" "}
            <em className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text not-italic text-transparent">
              Advantage
            </em>
          </h2>
          <h3 className="m-0 text-4xl text-[var(--appearance-text,#172454)]">
            Everything you need to sell more.
            <br />
            All in <span className="text-[var(--appearance-violet,#6d28d9)]">One place.</span>
          </h3>
          <p className="max-w-xl text-md leading-relaxed text-slate-800">
            From finding the right policy to managing customers, renewals,
            earnings and your partner network—MagikPolicy helps you run your
            insurance business smarter.
          </p>
        </div>
        <div className="relative grid min-h-64 place-items-center">
          {/* <div className="absolute h-60 w-60 rounded-full bg-gradient-to-br from-violet-100 to-pink-100" />
          <Laptop className="z-10 h-44 w-44 text-[var(--appearance-violet,#7c3aed)]" />
          <Image
            className="absolute z-20 w-24"
            src="/brand/magikpolicy-logo.png"
            alt="MagikPolicy platform"
            width={420}
            height={140}
          /> */}
          <div className="earning-image-responsive rounded-2xl flex w-full min-w-0 max-w-full items-center justify-center overflow-hidden px-0 max-md:px-1">
          <Image
            src="/brand/magikpolicy-super-advantages.png"
            alt="Example showing current rewards of 10,000 points plus up to 2,000 points MagikPolicy extra rewards equals up to 12,000 points total earning"
            width={794}
            height={499}
            className="block h-auto w-full min-w-0 max-w-[794px] object-contain max-lg:max-w-[680px] max-md:max-w-full"
            sizes="(max-width: 640px) calc(100vw - 48px), (max-width: 1024px) min(680px, calc(100vw - 80px)), 52vw"
          />
        </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
        {advantageCards.map(([Icon, title, copy]) => (
          <article
            className="flex gap-4 rounded-xl border border-[var(--appearance-border,#e2e8f0)] bg-[var(--appearance-surface,#fff)] p-5"
            key={title}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--appearance-surface-raised,#f5f3ff)] text-[var(--appearance-violet,#7c3aed)]">
              <Icon className="h-7 w-7" />
            </span>
            <div>
              <b className="block text-md text-[var(--appearance-text,#142151)]">{title}</b>
              <small className="mt-1 block text-[12px] font-semibold leading-relaxed text-[var(--appearance-muted,#64748b)]">
                {copy}
              </small>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-violet-400" />
          </article>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-violet-100 bg-[var(--appearance-surface,#fff)] p-5 hidden">
        <h3 className="m-0 text-lg text-[var(--appearance-text,#122050)]">
          And your business doesn't stop after one sale.
        </h3>
        <p className="text-xs text-[var(--appearance-muted,#64748b)]">
          One customer can become a long-term earning relationship.
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 overflow-auto">
          {[
            [UsersRound, "Customer", "First step"],
            [FileCheck2, "Policy", "Build trust"],
            [IndianRupee, "Rewards", "You earn"],
            [Clock3, "Renewal", "Earn again"],
            [TrendingUp, "Repeat Business", "More earnings"],
          ].map(([Icon, title, copy], i) => (
            <div
              className="flex shrink-0 items-center gap-3"
              key={String(title)}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--appearance-surface-raised,#f5f3ff)] text-[var(--appearance-violet,#7c3aed)]">
                <Icon className="h-5 w-5" />
              </span>
              <p>
                <b className="block text-[10px]">{String(title)}</b>
                <small className="text-[9px] text-[var(--appearance-muted,#64748b)]">
                  {String(copy)}
                </small>
              </p>
              {i < 4 && <ArrowRight className="h-4 w-4 text-violet-300" />}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-xl bg-gradient-to-r from-violet-50 to-pink-50 p-5 max-md:flex-col max-md:gap-4">
        <p className="m-0 text-sm font-semibold text-[var(--appearance-violet,#6d28d9)]">
          Build Network. Your business doesn't stop after one sell.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            className="btn-primary rounded-lg bg-gradient-to-r from-violet-700 to-pink-500 px-5 py-3 text-xs font-semibold text-white"
            onClick={() => setPartnerModalOpen(true)}
          >
            Start Growing with MagikPolicy
          </button>
          <Link
            className="btn-secondary rounded-lg border border-violet-500 bg-[var(--appearance-surface,#fff)] px-5 py-3 text-xs font-semibold text-[var(--appearance-violet,#6d28d9)]"
            href="/partner/register"
          >
            Explore Partner Benefits
          </Link>
        </div>
      </div>
      {partnerModalOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPartnerModalOpen(false);
          }}
        >
          <section
            aria-labelledby="partner-modal-title"
            aria-modal="true"
            className="relative my-6 w-full max-w-xl rounded-2xl bg-[var(--appearance-surface,#fff)] p-6 text-[var(--appearance-text,#172454)] shadow-2xl sm:p-8"
            role="dialog"
          >
            <button
              aria-label="Close partner registration form"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-[var(--appearance-muted,#64748b)] transition hover:bg-slate-200 hover:text-slate-800"
              onClick={() => setPartnerModalOpen(false)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="text-xs font-bold uppercase tracking-[.16em] text-[var(--appearance-violet,#7c3aed)]">
              Partner with MagikPolicy
            </span>
            <h2 className="mb-1 mt-3 pr-10 text-3xl" id="partner-modal-title">
              Become a Partner
            </h2>
            <p className="mb-6 mt-0 text-sm text-[var(--appearance-muted,#64748b)]">
              Fill in your details to begin your partner application.
            </p>
            <form
              className="grid grid-cols-2 gap-4 max-sm:grid-cols-1"
              onSubmit={submitPartnerApplication}
            >
              <label className="grid gap-1.5 text-xs font-semibold text-[var(--appearance-text,#334155)]">
                Full Name
                <input
                  autoFocus
                  className="h-11 rounded-lg border border-[var(--appearance-border,#e2e8f0)] px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  name="name"
                  placeholder="Enter your full name"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-[var(--appearance-text,#334155)]">
                Mobile Number
                <input
                  className="h-11 rounded-lg border border-[var(--appearance-border,#e2e8f0)] px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  inputMode="tel"
                  name="mobile"
                  pattern="[0-9+ ]{10,15}"
                  placeholder="Enter mobile number"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-[var(--appearance-text,#334155)]">
                Email Address
                <input
                  className="h-11 rounded-lg border border-[var(--appearance-border,#e2e8f0)] px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  name="email"
                  placeholder="Enter your email address"
                  required
                  type="email"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-[var(--appearance-text,#334155)]">
                City
                <input
                  className="h-11 rounded-lg border border-[var(--appearance-border,#e2e8f0)] px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  name="city"
                  placeholder="Enter your city"
                  required
                />
              </label>
              <label className="col-span-2 grid gap-1.5 text-xs font-semibold text-[var(--appearance-text,#334155)] max-sm:col-span-1">
                Business Type
                <select
                  className="h-11 rounded-lg border border-[var(--appearance-border,#e2e8f0)] bg-[var(--appearance-surface,#fff)] px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  defaultValue=""
                  name="businessType"
                  required
                >
                  <option disabled value="">Select business type</option>
                  <option>Individual Advisor</option>
                  <option>Insurance Agency</option>
                  <option>Financial Consultant</option>
                  <option>Corporate Partner</option>
                </select>
              </label>
              <label className="col-span-2 flex items-start gap-2 text-xs leading-relaxed text-[var(--appearance-muted,#64748b)] max-sm:col-span-1">
                <input className="mt-0.5 accent-violet-600" required type="checkbox" />
                <span>I agree to the Terms &amp; Conditions and Privacy Policy.</span>
              </label>
              <button
                className="btn-primary col-span-2 rounded-lg bg-gradient-to-r from-violet-700 to-pink-500 px-5 py-3.5 text-sm font-semibold text-white max-sm:col-span-1"
                type="submit"
              >
                Submit Application
              </button>
            </form>
            <p className="mb-0 mt-4 text-center text-xs text-[var(--appearance-muted,#64748b)]">
              Already a partner?{" "}
              <Link className="font-semibold text-[var(--appearance-violet,#6d28d9)]" href="/partner/login">
                Login here
              </Link>
            </p>
          </section>
        </div>
      )}
    </section>
  );
}

export function HomeReference() {
  return (
    <div className="home-responsive overflow-x-hidden bg-[var(--appearance-surface,#fafaff)] text-[var(--appearance-text,#0b174c)]">
      <section className="home-hero-responsive relative flex w-full flex-col overflow-hidden bg-[url('/brand/magikpolicy-home-banner.png')] bg-[length:auto_440px] bg-center-top bg-no-repeat pb-8 md:bg-[length:auto_560px] xl:aspect-[1942/809] xl:min-h-[680px] xl:block xl:bg-cover xl:bg-center xl:pb-0">
        <div className="relative z-10 min-h-[420px] px-5 pt-10 md:min-h-[520px] md:px-6 xl:absolute xl:left-[14.8%] xl:top-[12.5%] xl:min-h-0 xl:p-0">
          <h1 className="m-0 text-[clamp(2.8rem,3.05vw,3.8rem)] font-bold leading-[1.08] tracking-[-.035em] text-[var(--appearance-text,#172454)] max-md:text-[2.45rem]">
            Smart Insurance.
            <br />
            Simplified.
            <br />
            <em className="bg-gradient-to-r from-violet-700 to-pink-500 bg-clip-text not-italic text-transparent">
              Magically.
            </em>
          </h1>
          <p className="mb-0 mt-4 text-[clamp(1rem,1.25vw,1.5rem)] font-semibold text-[var(--appearance-text,#172454)] max-md:max-w-[19rem] max-md:text-sm">
            Buy any policy and get good reward instantly.
          </p>
        </div>
        <div className="home-quote-wrap relative z-20 mx-auto mt-4 w-[calc(100vw_-_24px)] min-w-0 max-w-[calc(100vw_-_24px)] md:w-[92%] md:max-w-[92%] xl:absolute xl:right-[10.6%] xl:top-[14.7%] xl:mt-0 xl:w-[31.2%] xl:max-w-none">
          <QuoteFinder />
          <div className="mt-4 flex h-10 items-center justify-center gap-5 text-base text-[var(--appearance-text,#172454)] max-2xl:text-sm max-md:gap-2 max-md:text-[11px]">
            <ShieldCheck className="h-5 w-5 text-[var(--appearance-violet,#7c3aed)]" />
            <span>100% Secure Process</span>
            <i>•</i>
            <Sparkles className="h-5 w-5 text-[var(--appearance-violet,#7c3aed)]" />
            <span>Best Prices</span>
          </div>
        </div>
      </section>
      <div className="mx-auto mt-5 w-[92%] max-w-[1500px]">
        <Stats />
      </div>
      <div className="h-20 max-md:h-12" />
      <div className="home-sections mx-auto grid w-[92%] max-w-[1500px] gap-24 pb-20 max-md:w-[calc(100%_-_24px)] max-md:gap-12 max-md:pb-12">
        <PartnerEarning />
        <PopularPlans />
        <ClaimBanner />
        <Testimonials />
        <Advantage />
      </div>
    </div>
  );
}
