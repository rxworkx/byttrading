import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Bot, Mail, MessageCircle, Repeat, ShieldCheck, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Services | BYT Trading",
};

const services = [
  {
    icon: Repeat,
    title: "Automated bot trading",
    description:
      "Subscribe to AetherGuard, QuantumPulse, or TitanForge and let a fixed cycle strategy trade for you, with target rates and cycle lengths published before you ever commit.",
    span: "lg:col-span-7",
    featured: true,
  },
  {
    icon: Wallet,
    title: "Wallet and fund management",
    description:
      "Every crypto asset gets its own dedicated wallet, and every trade you place draws straight from whichever wallet you pick. Fund it by card, bank transfer, or direct crypto deposit.",
    span: "lg:col-span-5",
    featured: false,
  },
  {
    icon: ShieldCheck,
    title: "Reviewed withdrawals",
    description:
      "Every withdrawal passes admin review before it settles, and two factor login is available whenever you want an extra layer of protection.",
    span: "lg:col-span-4",
    featured: false,
  },
  {
    icon: Activity,
    title: "Live market pricing",
    description:
      "Wallet balances are priced against live CoinGecko rates on a continuous refresh cycle, with a resilient cache so pricing never goes stale.",
    span: "lg:col-span-4",
    featured: false,
  },
  {
    icon: MessageCircle,
    title: "Personal onboarding",
    description:
      "Not sure which bot fits your goals? Talk to our team directly before you subscribe, no script and no pressure to commit by the end of the conversation.",
    span: "lg:col-span-4",
    featured: false,
  },
] as const;

export default function ServicesPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Services</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">What BYT Trading offers</h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              From automated trading to a wallet you can actually audit, everything here is built to be
              checked, not just trusted. Talk to us directly if you would rather ask before you start.
            </p>
          </div>

          <div className="rounded-3xl bg-background p-8 text-white sm:p-10">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Bot className="size-6" />
            </span>
            <h3 className="mt-5 text-xl font-semibold">Three bots, one platform</h3>
            <p className="mt-3 text-base text-white/80">
              AetherGuard, QuantumPulse, and TitanForge cover steady, balanced, and aggressive risk
              profiles, each running on the same transparent wallet and ledger infrastructure.
            </p>
            <Link
              href="/plans"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg brand-gradient px-5 py-3 text-base font-medium text-background hover:opacity-90"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </section>

      <section className="section-light section-light-hairline border-t">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12">
            {services.map((service) => (
              <div
                key={service.title}
                className={cn(
                  "group rounded-3xl border p-8 transition-all hover:-translate-y-0.5 hover:shadow-lg",
                  service.span,
                  service.featured
                    ? "bg-background border-transparent text-white"
                    : "section-light-card section-light-hairline",
                )}
              >
                <service.icon className={cn(service.featured ? "size-8" : "size-7", "text-primary")} />
                <h3 className={cn("mt-4 font-semibold", service.featured ? "text-2xl" : "text-lg")}>
                  {service.title}
                </h3>
                <p
                  className={cn(
                    "mt-2",
                    service.featured
                      ? "max-w-md text-base font-medium text-white/90"
                      : "text-base section-light-muted",
                  )}
                >
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 rounded-3xl border border-hairline bg-surface p-8 sm:p-10 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold">Would rather talk first?</h2>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              Reach out by email or WhatsApp and tell us what you are trying to figure out. We reply
              directly, in writing, with no meeting required unless you want one.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`mailto:${siteConfig.supportEmail}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg brand-gradient px-5 py-3 text-base font-medium whitespace-nowrap text-background hover:opacity-90"
            >
              <Mail className="size-4" /> Email our team
            </Link>
            <Link
              href={siteConfig.supportWhatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-hairline px-5 py-3 text-base font-medium whitespace-nowrap hover:bg-background/60"
            >
              <MessageCircle className="size-4" /> Chat on WhatsApp
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
