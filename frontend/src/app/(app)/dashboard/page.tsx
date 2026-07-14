"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, Gift, Layers, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { BotActivityIndicator } from "@/components/dashboard/bot-activity-indicator";
import { YearlyActivityChart } from "@/components/dashboard/yearly-activity-chart";
import { LivePriceFeed } from "@/components/dashboard/live-price-feed";
import { getMe, type PublicUser } from "@/lib/auth-client";
import {
  walletsApi,
  transactionsApi,
  investmentsApi,
  subscriptionsApi,
  kycApi,
  type Wallet,
  type Transaction,
  type Investment,
  type Subscription,
  type KycRecord,
} from "@/lib/dashboard-api";
import { bots } from "@/lib/site-config";
import { TransactionAmount } from "@/components/shared/transaction-amount";
import { formatDateTime, formatLabel } from "@/lib/utils";

// Only a COMPLETED transaction has actually moved the balance. A PENDING
// deposit hasn't credited the wallet yet, and a CANCELLED one never will
// (the refund, if any, is its own accounting) — counting them as "in" or
// "out" made the totals drift from the real balance.
function sumByType(transactions: Transaction[], type: string) {
  return transactions
    .filter((tx) => tx.type === type && tx.status === "COMPLETED")
    .reduce((sum, tx) => sum + Number(tx.usdEquivalent ?? tx.amount), 0);
}

function formatUsd(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [wallets, setWallets] = useState<Wallet[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [investments, setInvestments] = useState<Investment[] | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);
  const [kyc, setKyc] = useState<KycRecord | null>(null);

  useEffect(() => {
    getMe().then(setUser);
    walletsApi.list().then(setWallets);
    transactionsApi.mine().then(setTransactions);
    investmentsApi.mine().then(setInvestments);
    subscriptionsApi.mine().then(setSubscriptions);
    kycApi.mine().then(setKyc);
  }, []);

  const totalBalanceUsd = (wallets ?? []).reduce((sum, w) => sum + Number(w.usdValue || 0), 0);
  const activeInvestments = investments?.filter((i) => i.status === "ACTIVE" || i.status === "LOCKED" || i.status === "AWAITING") ?? [];
  const recentTransactions = transactions
    ? [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6)
    : [];
  const activeSubscriptions = subscriptions?.filter((s) => new Date(s.expiresAt) > new Date()) ?? [];
  // Includes both the one-time subscription bonus and every ongoing profit
  // commission, not just what's recorded on the Referral row itself.
  const totalReferralEarnings = sumByType(transactions ?? [], "REFERRAL_BONUS");

  const balanceReady = !!wallets && !!transactions;
  const tradingReady = !!transactions && !!investments;
  const activeReady = !!investments;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back{user ? `, ${user.firstName}` : ""}</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Here is where your balances, trades, and account stand right now.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {!balanceReady ? (
          <Skeleton className="h-52 w-full rounded-2xl" />
        ) : (
          <StatCard
            gradient
            label="Balance"
            value={formatUsd(totalBalanceUsd)}
            details={[
              {
                label: "Total in",
                value: formatUsd(
                  sumByType(transactions!, "DEPOSIT") +
                    sumByType(transactions!, "REFERRAL_BONUS") +
                    sumByType(transactions!, "PRINCIPAL_RELEASE") +
                    sumByType(transactions!, "PROFIT_CREDIT"),
                ),
              },
              {
                label: "Total out",
                value: formatUsd(
                  sumByType(transactions!, "WITHDRAWAL") +
                    sumByType(transactions!, "SUBSCRIPTION") +
                    sumByType(transactions!, "INVESTMENT_LOCK"),
                ),
              },
            ]}
            cta={
              <Button
                variant="secondary"
                className="w-full bg-background/90 text-foreground hover:bg-background"
                nativeButton={false}
                render={<Link href="/fund-account">Fund account</Link>}
              />
            }
          />
        )}

        {!tradingReady ? (
          <Skeleton className="h-52 w-full rounded-2xl" />
        ) : (
          <StatCard
            label="Trade volume"
            value={formatUsd(investments!.reduce((sum, i) => sum + Number(i.principal), 0))}
            details={[
              {
                label: "Total profit",
                value: formatUsd(investments!.reduce((sum, i) => sum + Number(i.profitAccrued), 0)),
              },
              { label: "Trades placed", value: investments!.length },
            ]}
            cta={
              <Button variant="outline" className="w-full" nativeButton={false} render={<Link href="/trading?addTrade=1">Place a trade</Link>} />
            }
          />
        )}

        {!activeReady ? (
          <Skeleton className="h-52 w-full rounded-2xl" />
        ) : (
          <StatCard
            label="Active trades"
            value={
              <>
                <span>{activeInvestments.length}</span>
                <BotActivityIndicator
                  hasSubscription={activeSubscriptions.length > 0}
                  trades={activeInvestments.map((inv) => {
                    const bot = bots.find((b) => b.slug === inv.plan.slug);
                    return {
                      id: inv.id,
                      botName: bot?.name ?? inv.plan.name,
                      color: bot?.color,
                      tradeRef: inv.id.slice(-6).toUpperCase(),
                    };
                  })}
                />
              </>
            }
            details={[
              {
                label: "Active profit",
                value: formatUsd(activeInvestments.reduce((sum, i) => sum + Number(i.profitAccrued), 0)),
              },
              {
                label: "Principal locked",
                value: formatUsd(activeInvestments.reduce((sum, i) => sum + Number(i.principal), 0)),
              },
            ]}
            cta={<Button variant="outline" className="w-full" nativeButton={false} render={<Link href="/trading">Manage trades</Link>} />}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!transactions || !investments ? (
            <Skeleton className="h-72 w-full rounded-2xl" />
          ) : (
            <YearlyActivityChart transactions={transactions} investments={investments} />
          )}
        </div>
        <LivePriceFeed limit={4} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-surface p-5 lg:col-span-1">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground">Account snapshot</h2>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-secondary/60 p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <span className="text-sm">Identity verification</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {kyc ? formatLabel(kyc.status) : "…"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-secondary/60 p-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span className="text-sm">Active subscriptions</span>
            </div>
            <span className="text-sm font-semibold">{subscriptions ? activeSubscriptions.length : "…"}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-secondary/60 p-3">
            <div className="flex items-center gap-2">
              <Gift className="size-4 text-primary" />
              <span className="text-sm">Referral earnings</span>
            </div>
            <span className="text-tabular text-sm font-semibold text-status-good">
              {transactions ? formatUsd(totalReferralEarnings) : "…"}
            </span>
          </div>

          <Link href="/referral" className="mt-auto text-sm font-medium text-primary hover:underline">
            Share your referral link
          </Link>
        </div>

        <div className="flex min-h-[280px] flex-col rounded-2xl border border-hairline bg-surface lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-sm font-semibold text-muted-foreground">Recent transactions</h2>
            <Link href="/transactions" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>

          {!transactions ? (
            <div className="flex flex-1 flex-col gap-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-5 text-center">
              <Coins className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nothing here yet. Fund your account to see activity appear.
              </p>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-hairline">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  <div>
                    <p className="font-medium">{formatLabel(tx.type)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
                  </div>
                  <TransactionAmount
                    amount={tx.amount}
                    currencySymbol={tx.currencySymbol}
                    usdEquivalent={tx.usdEquivalent}
                    type={tx.type}
                    maximumFractionDigits={4}
                    className="text-tabular text-right font-semibold"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
