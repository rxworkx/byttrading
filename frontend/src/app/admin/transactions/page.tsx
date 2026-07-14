"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TransactionAmount } from "@/components/shared/transaction-amount";
import { adminTransactionsApi, type AdminTransaction } from "@/lib/admin-api";
import { ApiError } from "@/lib/dashboard-api";
import { formatDateTime, formatLabel } from "@/lib/utils";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[] | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(() => {
    adminTransactionsApi.pending().then(setTransactions);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function confirm(id: string) {
    setWorkingId(id);
    try {
      await adminTransactionsApi.confirm(id);
      toast.success("Transaction confirmed");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not confirm");
    } finally {
      setWorkingId(null);
    }
  }

  async function reject(id: string) {
    setWorkingId(id);
    try {
      await adminTransactionsApi.reject(id);
      toast.success("Transaction cancelled");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not cancel");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transactions queue</h1>
        <p className="mt-1 text-base text-muted-foreground">Deposits and withdrawals awaiting review.</p>
      </div>

      {!transactions ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-8 text-center">
          <Receipt className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nothing pending review.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-hairline bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{formatLabel(tx.type)}</TableCell>
                  <TableCell className="text-tabular">
                    <TransactionAmount
                      amount={tx.amount}
                      currencySymbol={tx.currencySymbol}
                      usdEquivalent={tx.usdEquivalent}
                    type={tx.type}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tx.destinationAddress ?? "Not set"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(tx.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => reject(tx.id)} disabled={workingId === tx.id}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="brand-gradient text-background hover:opacity-90"
                        onClick={() => confirm(tx.id)}
                        disabled={workingId === tx.id}
                      >
                        Confirm
                      </Button>
                    </div>
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
