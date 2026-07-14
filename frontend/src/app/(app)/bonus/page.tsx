"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { transactionsApi, settingsApi, type Transaction, type PublicSetting } from "@/lib/dashboard-api";
import { formatDate } from "@/lib/utils";

export default function BonusPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [settings, setSettings] = useState<PublicSetting[] | null>(null);

  useEffect(() => {
    transactionsApi.mine().then(setTransactions);
    settingsApi.public().then(setSettings);
  }, []);

  const bonusPercent = settings?.find((s) => s.key === "referral_bonus_percent")?.value ?? "N/A";
  const commissionPercent = settings?.find((s) => s.key === "referral_profit_commission_percent")?.value ?? "N/A";

  const bonusTransactions = (transactions ?? [])
    .filter((tx) => tx.type === "REFERRAL_BONUS")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const totalEarned = bonusTransactions.reduce((sum, tx) => sum + Number(tx.usdEquivalent ?? tx.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bonus</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Earn {bonusPercent}% of a referred trader&apos;s first subscription fee, plus an ongoing{" "}
          {commissionPercent}% commission on the profit they make every time one of their trades completes.
          Both are credited straight to your balance, and neither is deducted from your referral.
        </p>
      </div>

      <div className="rounded-2xl border border-hairline brand-gradient p-5 text-background">
        <p className="text-xs text-background/80">Total bonus earned</p>
        <p className="text-tabular mt-2 text-2xl font-semibold">${totalEarned.toFixed(2)}</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Bonus history</h2>
        <div className="mt-3 space-y-2">
          {!transactions ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : bonusTransactions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-hairline bg-surface p-8 text-center">
              <Gift className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No bonuses credited yet. They land here the moment a referral subscribes or completes a trade.
              </p>
            </div>
          ) : (
            bonusTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-hairline bg-surface p-4">
                <div>
                  <p className="font-medium">{tx.relatedInvestmentId ? "Trade profit commission" : "Subscription bonus"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                </div>
                <span className="text-tabular text-sm font-semibold text-status-good">
                  +${Number(tx.usdEquivalent ?? tx.amount).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
