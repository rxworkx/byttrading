"use client";

import { useEffect, useState } from "react";
import { Copy, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getMe, type PublicUser } from "@/lib/auth-client";
import { referralsApi, settingsApi, transactionsApi, type Referral, type PublicSetting, type Transaction } from "@/lib/dashboard-api";
import { formatDate } from "@/lib/utils";

export default function ReferralPage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [referrals, setReferrals] = useState<Referral[] | null>(null);
  const [settings, setSettings] = useState<PublicSetting[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    getMe().then(setUser);
    referralsApi.mine().then(setReferrals);
    settingsApi.public().then(setSettings);
    transactionsApi.mine().then(setTransactions);
  }, []);

  const commissionPercent = settings?.find((s) => s.key === "referral_profit_commission_percent")?.value;

  const link = user && typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${user.referralCode}` : "";

  function copyLink() {
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied");
  }

  // Includes both the one-time subscription bonus and every ongoing profit
  // commission, so this total matches what actually landed in the balance.
  const totalEarned = (transactions ?? [])
    .filter((tx) => tx.type === "REFERRAL_BONUS")
    .reduce((sum, tx) => sum + Number(tx.usdEquivalent ?? tx.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Referral</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Share your link. When someone you refer subscribes to a bot, you earn a bonus automatically, plus
          {commissionPercent ? ` an ongoing ${commissionPercent}% commission` : " an ongoing commission"} on
          the profit from every trade they complete after that.
        </p>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-5">
        <p className="text-xs text-muted-foreground">Your referral link</p>
        <div className="mt-2 flex gap-2">
          <Input readOnly value={link} />
          <Button variant="outline" size="icon" onClick={copyLink} disabled={!link}>
            <Copy className="size-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-5">
        <p className="text-xs text-muted-foreground">Total referral earnings</p>
        <p className="text-tabular mt-2 text-2xl font-semibold text-status-good">${totalEarned.toFixed(2)}</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Your referrals</h2>
        <div className="mt-3 space-y-2">
          {!referrals ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-hairline bg-surface p-8 text-center">
              <Users className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No referrals yet. Share your link to get started.</p>
            </div>
          ) : (
            referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-hairline bg-surface p-4">
                <div>
                  <p className="font-medium">
                    {r.referred.firstName} {r.referred.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(r.referred.createdAt)}
                  </p>
                </div>
                <span className="text-tabular text-sm font-semibold text-status-good">
                  {r.bonusUsd ? `+$${Number(r.bonusUsd).toFixed(2)}` : "Pending"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
