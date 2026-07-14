"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Receipt } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { PlatformActivityChart } from "@/components/admin/platform-activity-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TransactionAmount } from "@/components/shared/transaction-amount";
import { adminApi, adminLedgerApi, type AdminStats, type AdminDailyActivity, type AdminLedgerTransaction } from "@/lib/admin-api";
import { formatDateTime, formatLabel } from "@/lib/utils";

function formatUsd(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

const statusStyles: Record<string, string> = {
  COMPLETED: "bg-status-good/15 text-status-good",
  PENDING: "bg-status-warning/15 text-status-warning",
  REJECTED: "bg-destructive/15 text-destructive",
  CANCELLED: "bg-destructive/15 text-destructive",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<AdminDailyActivity[] | null>(null);
  const [recent, setRecent] = useState<AdminLedgerTransaction[] | null>(null);

  useEffect(() => {
    adminApi.stats().then(setStats);
    adminApi.dailyActivity(14).then(setActivity);
    adminLedgerApi.list({}).then((txs) => setRecent(txs.slice(0, 8)));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="mt-1 text-base text-muted-foreground">
          A live snapshot of users, money movement, and trades.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!stats ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)
        ) : (
          <>
            <StatCard
              gradient
              label="Users"
              value={stats.totalUsers}
              details={[
                { label: "New in last 7 days", value: stats.newUsersLast7Days },
                { label: "Pending approval", value: stats.pendingApprovalCount },
                { label: "Pending KYC", value: stats.pendingKycCount },
              ]}
              cta={
                <Button
                  variant="default"
                  size="sm"
                  className="w-full shadow-md"
                  nativeButton={false}
                  render={<Link href="/admin/users">View users</Link>}
                />
              }
            />
            <StatCard
              label="Pending transactions"
              value={
                <>
                  <span className="text-status-good">+{formatUsd(stats.depositsPendingUsd)}</span>
                  {stats.withdrawalsPendingCount > 0 ? (
                    <span className="text-destructive">-{formatUsd(stats.withdrawalsPendingUsd)}</span>
                  ) : null}
                </>
              }
              details={[
                { label: "Deposits pending", value: stats.depositsPendingCount },
                { label: "Withdrawals pending", value: stats.withdrawalsPendingCount },
                { label: "Total pending", value: stats.depositsPendingCount + stats.withdrawalsPendingCount },
              ]}
              cta={
                <Button size="sm" className="w-full shadow-md" nativeButton={false} render={<Link href="/admin/transactions">Review pending</Link>} />
              }
            />
            <StatCard
              label="Transactions"
              value={formatUsd(stats.netTransactionsUsd)}
              details={[
                { label: "Deposits", value: formatUsd(stats.depositsTotalUsd) },
                { label: "Withdrawals", value: formatUsd(stats.withdrawalsTotalUsd) },
                { label: "This week", value: formatUsd(stats.depositsThisWeekUsd - stats.withdrawalsThisWeekUsd) },
              ]}
              cta={
                <Button size="sm" className="w-full shadow-md" nativeButton={false} render={<Link href="/admin/ledger">View all transactions</Link>} />
              }
            />
            <StatCard
              label="Trades"
              value={stats.activeInvestmentsCount}
              details={[
                { label: "Principal locked", value: formatUsd(stats.activeInvestmentsPrincipal) },
                { label: "Active subscriptions", value: stats.activeSubscriptionsCount },
                { label: "Profit credited", value: formatUsd(stats.totalProfitCreditedUsd) },
              ]}
              cta={
                <Button size="sm" className="w-full shadow-md" nativeButton={false} render={<Link href="/admin/tradings?status=active">View active trades</Link>} />
              }
            />
            <StatCard
              label="Referral commissions"
              value={formatUsd(stats.totalReferralCommissionsUsd)}
              details={[{ label: "Paid out to referrers", value: formatUsd(stats.totalReferralCommissionsUsd) }]}
              cta={
                <Button size="sm" className="w-full shadow-md" nativeButton={false} render={<Link href="/admin/ledger?type=REFERRAL_BONUS">View commissions</Link>} />
              }
            />
            <StatCard
              label="Platform USD balance"
              value={formatUsd(stats.platformUsdBalance)}
              details={[{ label: "Fiat wallets", value: formatUsd(stats.platformUsdBalance) }]}
            />
          </>
        )}
      </div>

      {!activity ? (
        <Skeleton className="h-80 w-full rounded-2xl" />
      ) : (
        <PlatformActivityChart data={activity} />
      )}

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Recent transactions</h2>
          <Link href="/admin/ledger" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            See all <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {!recent ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-8 text-center">
            <Receipt className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-hairline bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <p className="font-medium text-tabular">{tx.reference}</p>
                      <p className="text-xs text-muted-foreground">{tx.userName}</p>
                    </TableCell>
                    <TableCell>{formatLabel(tx.type)}</TableCell>
                    <TableCell className="text-tabular">
                      <TransactionAmount
                        amount={tx.amount}
                        currencySymbol={tx.currencySymbol}
                        usdEquivalent={tx.usdEquivalent}
                      type={tx.type}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge className={`border-0 ${statusStyles[tx.status] ?? "bg-secondary text-foreground"}`}>
                        {formatLabel(tx.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(tx.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
