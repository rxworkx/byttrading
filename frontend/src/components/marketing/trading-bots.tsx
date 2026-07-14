import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { bots } from "@/lib/site-config";
import { formatPayFrequencyShort } from "@/lib/utils";

export function TradingBots() {
  return (
    <section id="bots" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">Our bots</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Meet the trading bots</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Each bot runs a fixed length trading cycle with its own risk profile. Subscribe once, fund a
          trade, and let the cycle run its course while you track progress from your dashboard.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        {bots.map((bot) => (
          <Card key={bot.slug} className="overflow-hidden border-hairline bg-surface py-0">
            <div className="relative aspect-[4/5] w-full">
              <Image src={bot.image} alt={bot.name} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <Badge className="brand-gradient border-0 text-background">{bot.tagline}</Badge>
              </div>
            </div>
            <CardContent className="space-y-4 pb-6">
              <div>
                <h3 className="text-xl font-semibold">{bot.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{bot.description}</p>
              </div>
              <dl className="grid grid-cols-2 gap-4 border-t border-hairline pt-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Target rate</dt>
                  <dd className="text-tabular mt-1 font-semibold text-status-good">
                    {bot.rateRange}
                    {bot.rateNote ? <span className="text-xs text-muted-foreground"> {bot.rateNote}</span> : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Payout frequency</dt>
                  <dd className="mt-1 font-semibold">{formatPayFrequencyShort(bot.payFrequency)}</dd>
                </div>
              </dl>
              <Link
                href="/plans"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View pricing <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
