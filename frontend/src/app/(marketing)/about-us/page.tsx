import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers, ShieldCheck, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About Us | BYT Trading",
};

const pillars = [
  {
    icon: Layers,
    title: "Three bots, three risk profiles",
    description:
      "Instead of one opaque strategy, we run AetherGuard, QuantumPulse, and TitanForge side by side, each with its own published rate range and cycle length.",
    span: "lg:col-span-7",
    featured: true,
  },
  {
    icon: Wallet,
    title: "A ledger you can actually read",
    description:
      "Every wallet, transfer, subscription fee, and profit credit lives in a single transaction history, so nothing moves without a record you can see.",
    span: "lg:col-span-5",
    featured: false,
  },
  {
    icon: ShieldCheck,
    title: "A registered company",
    description:
      "BYT Trading operates under a verifiable Australian Business Number, checkable in seconds on the public register.",
    span: "lg:col-span-6",
    featured: false,
  },
  {
    icon: Users,
    title: "Support that responds",
    description:
      "Questions about a plan, a deposit, or a withdrawal reach a real person, not a queue that goes quiet.",
    span: "lg:col-span-6",
    featured: false,
  },
] as const;

export default function AboutUsPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">About BYT Trading</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Automated trading, without the black box
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              BYT Trading was built to make automated crypto trading accessible without sacrificing
              transparency. You always know which bot is trading your funds, what range it targets, and
              exactly when your money unlocks.
            </p>
            <Link
              href="/technology"
              className="mt-6 inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline"
            >
              See how it works <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="rounded-3xl bg-background p-8 text-white sm:p-10">
            <p className="text-sm text-white/60">What we run today</p>
            <dl className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <dt className="text-sm text-white/60">Trading bots</dt>
                <dd className="text-tabular mt-1 text-3xl font-bold">3</dd>
              </div>
              <div>
                <dt className="text-sm text-white/60">Ledger entries</dt>
                <dd className="text-tabular mt-1 text-3xl font-bold">1</dd>
              </div>
              <div>
                <dt className="text-sm text-white/60">Cycle lengths</dt>
                <dd className="text-tabular mt-1 text-3xl font-bold">7 to 21 days</dd>
              </div>
              <div>
                <dt className="text-sm text-white/60">Company registration</dt>
                <dd className="mt-1 text-lg font-semibold text-status-good">ABN verified</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="section-light section-light-hairline border-t">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">Our story</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Built from a bot we already ran with our own money
              </h2>
            </div>
            <div className="lg:col-span-7">
              <p className="text-xl leading-relaxed font-medium tracking-tight section-light-muted">
                The team behind BYT Trading spent years running an internal trading bot for our own
                capital. This platform packages that same bot logic so other traders can subscribe to it
                directly, instead of building their own infrastructure from scratch.
              </p>
              <p className="mt-6 text-base section-light-muted">
                Every wallet, transaction, and trade cycle in your account is tracked in a single ledger.
                Funds move through clearly defined states: available, locked in an active trade, or
                pending admin review on deposit and withdrawal. Nothing moves silently, and nothing is
                left for you to guess at. We hold ourselves to the same standard we would want from any
                platform handling our own money: clear terms, visible risk disclosures, and support that
                actually responds.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Why it is different</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">What sets us apart</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className={cn(
                "group rounded-3xl border p-8 transition-all hover:-translate-y-0.5 hover:shadow-lg",
                pillar.span,
                pillar.featured
                  ? "bg-background border-transparent text-white"
                  : "border-hairline bg-surface",
              )}
            >
              <pillar.icon className={cn(pillar.featured ? "size-8" : "size-7", "text-primary")} />
              <h3 className={cn("mt-4 font-semibold", pillar.featured ? "text-2xl" : "text-lg")}>
                {pillar.title}
              </h3>
              <p
                className={cn(
                  "mt-2",
                  pillar.featured ? "max-w-md text-base font-medium text-white/90" : "text-base text-muted-foreground",
                )}
              >
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-light section-light-hairline border-t">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-8 rounded-3xl bg-background p-8 text-white sm:p-10 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Registered and checkable</h2>
              <p className="mt-3 max-w-xl text-base text-white/80">
                We publish our regulatory status plainly rather than leaving you to wonder about it. Check
                our Australian Business Number independently any time.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={siteConfig.abnUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-base font-medium whitespace-nowrap hover:bg-white/5"
              >
                Verify ABN
              </Link>
              <Link
                href="/legal/company-registration"
                className="inline-flex items-center justify-center gap-2 rounded-lg brand-gradient px-5 py-3 text-base font-medium whitespace-nowrap text-background hover:opacity-90"
              >
                Company registration
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
