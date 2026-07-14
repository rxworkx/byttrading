"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TransactionAmount } from "@/components/shared/transaction-amount";
import { CopyButton } from "@/components/shared/copy-button";
import { transactionsApi, type Transaction } from "@/lib/dashboard-api";
import { formatDateTime, formatLabel } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  COMPLETED: "bg-status-good/15 text-status-good",
  PENDING: "bg-status-warning/15 text-status-warning",
  CANCELLED: "bg-destructive/15 text-destructive",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    transactionsApi.mine().then(setTransactions);
  }, []);

  const sorted = useMemo(
    () =>
      [...(transactions ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [transactions],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Every deposit, withdrawal, transfer, subscription fee, and profit credit on your account, in one
          ledger.
        </p>
      </div>

      {!transactions ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-10 text-center">
          <Receipt className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nothing here yet. Your activity will show up as it happens.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-hairline bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-tabular font-medium">
                    <Link href={`/transactions/detail?id=${tx.id}`} className="text-primary hover:underline">
                      {tx.reference}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">{formatLabel(tx.type)}</TableCell>
                  <TableCell className="text-tabular">
                    <TransactionAmount
                      amount={tx.amount}
                      currencySymbol={tx.currencySymbol}
                      usdEquivalent={tx.usdEquivalent}
                    type={tx.type}
                    />
                  </TableCell>
                  <TableCell className="max-w-40 text-muted-foreground">
                    {tx.destinationAddress ? (
                      <div className="flex items-center gap-1">
                        <span className="truncate">{tx.destinationAddress}</span>
                        <CopyButton value={tx.destinationAddress} />
                      </div>
                    ) : (
                      "Not set"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`border-0 ${statusStyles[tx.status] ?? "bg-secondary text-foreground"}`}>
                      {formatLabel(tx.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(tx.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
