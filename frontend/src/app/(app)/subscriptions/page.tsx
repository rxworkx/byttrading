"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers, Lock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BotCard } from "@/components/dashboard/bot-card";
import {
  plansApi,
  subscriptionsApi,
  walletsApi,
  type InvestmentPlan,
  type Subscription,
  type Wallet,
} from "@/lib/dashboard-api";
import { bots } from "@/lib/site-config";
import { formatDate } from "@/lib/utils";

const steps = [
  {
    icon: Layers,
    title: "Subscribe to a bot",
    description: "Every card below is a plan. Subscribe once for a 6 month or 1 year term to unlock trading with it.",
  },
  {
    icon: Lock,
    title: "Set an amount and place the trade",
    description: "From Trading, pick a wallet to fund from and set an amount. It is debited immediately and locked for the cycle.",
  },
  {
    icon: TrendingUp,
    title: "Collect principal and profit",
    description: "When the cycle completes, everything credits back to that same wallet automatically.",
  },
];

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<InvestmentPlan[] | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const load = useCallback(() => {
    plansApi.list().then(setPlans);
    subscriptionsApi.mine().then(setSubscriptions);
    walletsApi.list().then(setWallets);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeSubscriptions = subscriptions.filter((s) => new Date(s.expiresAt) > new Date());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Plans</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Subscribe once for a 6 month or 1 year term, then place as many trades as you like with that
          bot for the life of your subscription. No extra fee per trade.
        </p>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-6">
        <h2 className="font-semibold">How placing a trade works</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg brand-gradient text-background">
                <step.icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!plans
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)
          : plans.map((plan) => {
              const bot = bots.find((b) => b.slug === plan.slug);
              return (
                <BotCard
                  key={plan.id}
                  plan={plan}
                  image={bot?.image}
                  tagline={bot?.tagline}
                  wallets={wallets}
                  subscription={subscriptions
                    .filter((s) => s.planId === plan.id)
                    .sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime())[0]}
                  onChanged={load}
                />
              );
            })}
      </div>

      {activeSubscriptions.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground">Your active subscriptions</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeSubscriptions.map((s) => (
              <div key={s.id} className="rounded-2xl border border-hairline bg-surface p-5">
                <p className="font-medium">{s.plan.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {s.term === "SIX_MONTHS" ? "6 month term" : "1 year term"}, renews{" "}
                  {formatDate(s.expiresAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
