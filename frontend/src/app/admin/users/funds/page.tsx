"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, type AdminUserDetail, type AdminUserReferrals } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/utils";

function formatUsd(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface FundsRow {
  title: string;
  value: string;
  button?: { label: string; href: string };
}

function FundsRowItem({ row }: { row: FundsRow }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <p className="text-sm font-medium">{row.title}</p>
      <div className="flex items-center gap-4">
        <p className="text-tabular text-sm text-muted-foreground">{row.value}</p>
        {row.button ? (
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href={row.button.href}>{row.button.label}</Link>}
          />
        ) : null}
      </div>
    </div>
  );
}

function AdminUserFundsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("userId") ?? "";
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [referrals, setReferrals] = useState<AdminUserReferrals | null>(null);

  const load = useCallback(() => {
    adminApi.userDetail(id).then(setDetail);
    adminApi.getUserReferrals(id).then(setReferrals);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const rows: FundsRow[] | null =
    detail && referrals
      ? [
          {
            title: "Balance",
            value: formatUsd(detail.stats.balanceUsd),
            button: { label: "Wallets", href: `/admin/users/wallets?userId=${id}` },
          },
          {
            title: "Net transactions",
            value: formatUsd(detail.stats.depositsUsd - detail.stats.withdrawalsUsd),
            button: { label: "Transactions", href: `/admin/ledger?userId=${id}` },
          },
          {
            title: "Deposits",
            value: formatUsd(detail.stats.depositsUsd),
            button: { label: "Deposits", href: `/admin/ledger?type=DEPOSIT&userId=${id}` },
          },
          {
            title: "Pending deposits",
            value: formatUsd(detail.stats.pendingDepositsUsd),
            button: { label: "Pending", href: `/admin/ledger?type=DEPOSIT&status=PENDING&userId=${id}` },
          },
          {
            title: "Trades",
            value: formatUsd(detail.stats.tradesUsd),
            button: { label: "Trades", href: `/admin/tradings?userId=${id}` },
          },
          {
            title: "Active trades",
            value: formatUsd(detail.stats.activeTradesUsd),
            button: { label: "Active trades", href: `/admin/tradings?status=active&userId=${id}` },
          },
          {
            title: "Earnings",
            value: formatUsd(detail.stats.earningsUsd),
            button: { label: "Earnings", href: `/admin/earnings?userId=${id}` },
          },
          {
            title: "Withdrawals",
            value: formatUsd(detail.stats.withdrawalsUsd),
            button: { label: "Withdrawals", href: `/admin/ledger?type=WITHDRAWAL&userId=${id}` },
          },
          {
            title: "Referrals",
            value: String(referrals.downlines.length),
            button: { label: "Referrals", href: `/admin/users/referrals?userId=${id}` },
          },
          {
            title: "Referral commissions",
            value: formatUsd(detail.stats.referralCommissionUsd),
            button: { label: "Commissions", href: `/admin/ledger?type=REFERRAL_BONUS&userId=${id}` },
          },
          {
            title: "Last login at",
            value: detail.user.lastLoginAt ? formatDateTime(detail.user.lastLoginAt) : "Never",
          },
          { title: "Date registered", value: formatDateTime(detail.user.createdAt) },
        ]
      : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/users/detail?userId=${id}`}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to user
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">
          {detail ? `${detail.user.firstName} ${detail.user.lastName}'s funds` : "Funds"}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">Balance, activity, and referral totals for this user.</p>
      </div>

      {!rows ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
          {rows.map((row) => (
            <FundsRowItem key={row.title} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminUserFundsPage() {
  return (
    <Suspense>
      <AdminUserFundsContent />
    </Suspense>
  );
}
