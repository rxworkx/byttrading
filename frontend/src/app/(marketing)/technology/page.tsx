import type { Metadata } from "next";
import { Activity, Database, Lock, ServerCog, ShieldCheck, Wallet, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Technology | BYT Trading",
};

const pillars = [
  {
    icon: Zap,
    title: "Automated cycle engine",
    description:
      "A scheduled job tracks every active trade, applies profit accrual within the bot's published rate range, and releases principal plus profit the moment a cycle completes, with no manual intervention required.",
    span: "lg:col-span-7",
    featured: true,
  },
  {
    icon: Activity,
    title: "Live market data",
    description:
      "Wallet balances are priced against live rates pulled from CoinGecko on a continuous refresh cycle, with a resilient cache so pricing never goes stale during a temporary rate limit or outage.",
    span: "lg:col-span-5",
    featured: false,
  },
  {
    icon: Wallet,
    title: "Ledgered wallet architecture",
    description:
      "Every crypto asset gets its own wallet, and a trade or subscription draws straight from the one you pick. Every balance change is recorded as a transaction.",
    span: "lg:col-span-6",
    featured: false,
  },
  {
    icon: Lock,
    title: "Account security, on your terms",
    description:
      "Passwords are hashed with Argon2, sessions use short lived access tokens with rotating refresh tokens, and two factor login is available whenever you choose to turn it on.",
    span: "lg:col-span-6",
    featured: false,
  },
] as const;

const stack = [
  { icon: ServerCog, label: "Next.js and NestJS" },
  { icon: Database, label: "PostgreSQL via Supabase" },
  { icon: ShieldCheck, label: "TypeORM migrations" },
];

const dataFlow = [
  {
    step: "01",
    title: "You initiate an action",
    description:
      "A deposit, a withdrawal, a subscription, or a trade. Every action starts as a single request from your account.",
  },
  {
    step: "02",
    title: "The API validates and records it",
    description:
      "NestJS checks balances and permissions, then writes the change as a transaction row before touching any wallet balance, so the ledger and the balance can never quietly disagree.",
  },
  {
    step: "03",
    title: "The cycle engine takes over, if relevant",
    description:
      "For trades, a scheduled job owns the lock and release logic end to end. No admin has to remember to run anything for your cycle to complete on time.",
  },
  {
    step: "04",
    title: "Your dashboard reflects it immediately",
    description:
      "Balances, transaction history, and active trade status all read from the same source of truth, so what you see in your account is what actually happened.",
  },
];

const glow =
  "bg-gradient-to-b from-[var(--surface-light-hairline)] via-primary to-[var(--surface-light-hairline)] shadow-[0_0_14px_2px_rgba(20,184,166,0.55)]";

export default function TechnologyPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Under the hood</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Our technology</h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              A look at how BYT Trading keeps your balances accurate, your trades transparent, and your
              account secure, without needing you to trust a black box.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 rounded-3xl border border-hairline bg-surface p-8 sm:p-10">
            <p className="w-full text-sm text-muted-foreground">Built on a modern stack</p>
            {stack.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-hairline bg-background px-4 py-2 text-sm font-medium"
              >
                <item.icon className="size-4 text-primary" />
                {item.label}
              </span>
            ))}
            <p className="mt-2 w-full text-sm text-muted-foreground">
              We chose boring, well tested infrastructure on purpose. Your money should not depend on
              experimental software.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className={cn(
                "group rounded-3xl border p-8 transition-all hover:-translate-y-0.5 hover:shadow-lg",
                pillar.span,
                pillar.featured ? "bg-background border-transparent text-white" : "border-hairline bg-surface",
              )}
            >
              <pillar.icon className={cn(pillar.featured ? "size-8" : "size-7", "text-primary")} />
              <h2 className={cn("mt-4 font-semibold", pillar.featured ? "text-2xl" : "text-lg")}>{pillar.title}</h2>
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
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">The request path</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              What happens when you take an action
            </h2>
            <p className="mt-4 text-lg section-light-muted">
              It helps to know what is actually going on behind a button click. Here is the path every
              deposit, transfer, and trade takes through the system, in order.
            </p>
          </div>

          <div className="mt-16">
            <div className="relative">
              <div className="absolute top-5 right-[12.5%] left-[12.5%] hidden h-px -translate-y-1/2 bg-gradient-to-r from-[var(--surface-light-hairline)] via-primary to-[var(--surface-light-hairline)] shadow-[0_0_14px_2px_rgba(20,184,166,0.35)] sm:block" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                {dataFlow.map((item) => (
                  <div key={item.step} className="flex flex-col items-center text-center sm:items-stretch sm:text-left">
                    <span className="relative z-10 size-3 self-center rounded-full bg-primary shadow-[0_0_10px_2px_rgba(20,184,166,0.6)] sm:self-start" />
                    <div className={cn("mx-auto h-4 w-px sm:mx-0", glow)} />
                    <div className="section-light-card section-light-hairline rounded-2xl border p-6">
                      <span className="text-tabular text-sm font-semibold text-primary">{item.step}</span>
                      <p className="mt-2 font-semibold">{item.title}</p>
                      <p className="mt-2 text-base section-light-muted">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
