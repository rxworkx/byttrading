"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { LivePriceFeed } from "@/components/dashboard/live-price-feed";
import { transactionsApi, type Transaction } from "@/lib/dashboard-api";

function sumProfitBetween(transactions: Transaction[], start: Date, end: Date) {
  return transactions
    .filter((tx) => tx.type === "PROFIT_CREDIT")
    .filter((tx) => {
      const d = new Date(tx.createdAt);
      return d >= start && d < end;
    })
    .reduce((sum, tx) => sum + Number(tx.usdEquivalent ?? tx.amount), 0);
}

export default function TransparencyPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    transactionsApi.mine().then(setTransactions);
  }, []);

  if (!transactions) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - 7);
  const startOfLastWeek = new Date(now);
  startOfLastWeek.setDate(now.getDate() - 14);

  const thisWeek = sumProfitBetween(transactions, startOfThisWeek, now);
  const lastWeek = sumProfitBetween(transactions, startOfLastWeek, startOfThisWeek);

  const allProfitTx = transactions.filter((tx) => tx.type === "PROFIT_CREDIT");
  const totalProfit = allProfitTx.reduce((sum, tx) => sum + Number(tx.usdEquivalent ?? tx.amount), 0);
  const weeksTracked = allProfitTx.length
    ? Math.max(
        1,
        Math.ceil(
          (now.getTime() - new Date(allProfitTx[allProfitTx.length - 1].createdAt).getTime()) /
            (7 * 24 * 60 * 60 * 1000),
        ),
      )
    : 1;
  const averageWeekly = totalProfit / weeksTracked;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transparency</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Real profit credited to your account. No projections, just completed trade cycles.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-hairline bg-surface">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">Profit this week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-tabular text-2xl font-semibold text-status-good">${thisWeek.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-hairline bg-surface">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">Profit last week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-tabular text-2xl font-semibold">${lastWeek.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-hairline bg-surface">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">Average weekly profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-tabular text-2xl font-semibold">${averageWeekly.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-hairline bg-surface">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Performance overview</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceChart transactions={transactions} />
        </CardContent>
      </Card>

      <LivePriceFeed />
    </div>
  );
}
