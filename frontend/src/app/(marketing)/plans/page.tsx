import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch, type InvestmentPlan } from "@/lib/api";
import { bots } from "@/lib/site-config";
import { formatRateFrequency, isDailyFrequency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Plans | BYT Trading",
  description: "Compare AetherGuard, QuantumPulse, and TitanForge trading bot subscription plans.",
};

async function getPlans(): Promise<InvestmentPlan[] | null> {
  try {
    return await apiFetch<InvestmentPlan[]>("/plans");
  } catch {
    return null;
  }
}

export default async function PlansPage() {
  const plans = await getPlans();

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Pricing</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Plans and pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Subscribe once for a 6 month or 1 year term, then fund as many trade cycles as you like with
            that bot for the life of your subscription. No hidden fees per trade.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {bots.map((bot) => {
            const plan = plans?.find((p) => p.slug === bot.slug);
            const pricing = plan?.pricing ?? bot.pricing;
            // plan.rateRange is raw "min-max"; the static bot fallback is
            // already formatted (e.g. "0.25% to 0.6%"), so only the live
            // plan case runs through formatRateFrequency.
            const rateFrequency = plan
              ? formatRateFrequency(plan.rateRange, plan.payFrequency)
              : `${bot.rateRange} ${isDailyFrequency(bot.payFrequency) ? "daily" : `every ${bot.payFrequency}`}`;
            const rateNote = plan?.rateNote ?? bot.rateNote;

            return (
              <Card key={bot.slug} className="overflow-hidden border-hairline bg-surface py-0">
                <div className="relative aspect-video w-full">
                  <Image src={bot.image} alt={bot.name} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />
                  <Badge className="absolute bottom-3 left-3 brand-gradient border-0 text-background">
                    {bot.tagline}
                  </Badge>
                </div>
                <CardContent className="space-y-6 pb-8">
                  <div>
                    <h2 className="text-xl font-semibold">{bot.name}</h2>
                    <p className="text-tabular mt-1 text-base font-medium text-status-good">
                      {rateFrequency} {rateNote ? <span className="text-muted-foreground">{rateNote}</span> : null}
                    </p>
                  </div>

                  <div className="space-y-3 border-t border-hairline pt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-base text-muted-foreground">6 month subscription</span>
                      <span className="text-tabular text-lg font-semibold">${pricing["6mo"]}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base text-muted-foreground">1 year subscription</span>
                      <span className="text-tabular text-lg font-semibold">${pricing["1yr"]}</span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full brand-gradient text-background hover:opacity-90"
                    nativeButton={false}
                    render={<Link href="/signup">Subscribe</Link>}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </>
  );
}
