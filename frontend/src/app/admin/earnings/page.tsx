"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TransactionAmount } from "@/components/shared/transaction-amount";
import { adminEarningsApi, type AdminEarnings } from "@/lib/admin-api";
import { formatDateTime, formatLabel } from "@/lib/utils";

function formatUsd(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function EarningsContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? undefined;
  const [earnings, setEarnings] = useState<AdminEarnings | null>(null);

  useEffect(() => {
    setEarnings(null);
    adminEarningsApi.get(userId).then(setEarnings);
  }, [userId]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Earnings</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Every trade profit and referral commission credited to users.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!earnings ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
        ) : (
          <>
            <StatCard gradient label="Trade profit credited" value={formatUsd(earnings.totalProfitCredited)} />
            <StatCard label="Referral commissions" value={formatUsd(earnings.totalReferralCommissions)} />
          </>
        )}
      </div>

      {!earnings ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : earnings.transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-8 text-center">
          <Coins className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnings.transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <p className="font-medium text-tabular">{tx.reference}</p>
                    <p className="text-xs text-muted-foreground">{tx.userName}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`border-0 ${
                        tx.type === "PROFIT_CREDIT" ? "bg-status-good/15 text-status-good" : "bg-primary/15 text-primary"
                      }`}
                    >
                      {formatLabel(tx.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tx.adminNote ?? ""}</TableCell>
                  <TableCell className="text-tabular">
                    <TransactionAmount
                      amount={tx.amount}
                      currencySymbol={tx.currencySymbol}
                      usdEquivalent={tx.usdEquivalent}
                    type={tx.type}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(tx.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function AdminEarningsPage() {
  return (
    <Suspense>
      <EarningsContent />
    </Suspense>
  );
}
