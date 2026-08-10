"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ListPlus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusEditButton, type StatusOption } from "@/components/admin/status-edit-button";
import { TransactionAmount } from "@/components/shared/transaction-amount";
import { adminLedgerApi, type AdminLedgerTransaction } from "@/lib/admin-api";
import { ApiError } from "@/lib/dashboard-api";
import { formatDateTime, formatLabel } from "@/lib/utils";
import { useRowSelection } from "@/lib/use-row-selection";

const STATUS_STYLES: StatusOption[] = [
  { value: "PENDING", label: "Pending", className: "bg-status-warning/15 text-status-warning" },
  { value: "COMPLETED", label: "Confirmed", className: "bg-status-good/15 text-status-good" },
  { value: "CANCELLED", label: "Cancelled", className: "bg-destructive/15 text-destructive" },
];

const TITLES: Record<string, string> = {
  DEPOSIT: "Deposits",
  WITHDRAWAL: "Withdrawals",
  REFERRAL_BONUS: "Referral commissions",
};

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function sourceLabel(tx: AdminLedgerTransaction) {
  if (tx.adminNote) return tx.adminNote;
  if (tx.relatedInvestmentId) return "Trade profit commission";
  return "";
}

function LedgerContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;
  const [status, setStatus] = useState(searchParams.get("status") ?? "ALL");
  const [transactions, setTransactions] = useState<AdminLedgerTransaction[] | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { selectedIds, toggleOne, toggleAll, isAllSelected, clear } = useRowSelection(
    transactions?.map((tx) => tx.id) ?? [],
  );

  const load = useCallback(() => {
    adminLedgerApi.list({ type, status: status === "ALL" ? undefined : status, userId }).then(setTransactions);
  }, [type, status, userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(id: string, next: string) {
    try {
      await adminLedgerApi.setStatus(id, next as "PENDING" | "COMPLETED" | "CANCELLED");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update status");
    }
  }

  async function bulkDelete() {
    const ids = Array.from(selectedIds);
    setConfirmDeleteOpen(false);
    const results = await Promise.allSettled(ids.map((id) => adminLedgerApi.delete(id)));
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;
    if (succeeded > 0) toast.success(`Deleted ${succeeded} transaction${succeeded === 1 ? "" : "s"}`);
    if (failed > 0) toast.error(`${failed} transaction${failed === 1 ? "" : "s"} could not be deleted`);
    clear();
    load();
  }

  const title = (type && TITLES[type]) || "Transactions";
  const showSource = type === "REFERRAL_BONUS";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-base text-muted-foreground">
            {userId
              ? `${type ? formatLabel(type).toLowerCase() : "Transactions"} for this user.`
              : type
                ? `Every ${formatLabel(type).toLowerCase()} transaction across all users.`
                : "Every transaction across all users, any type."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={(v) => v && setStatus(v)}>
            <SelectTrigger className="w-44">
              <SelectValue>{STATUS_FILTER_OPTIONS.find((o) => o.value === status)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            nativeButton={false}
            className="brand-gradient text-background hover:opacity-90"
            render={
              <Link href="/admin/add-transaction">
                <ListPlus className="size-3.5" /> Add transaction
              </Link>
            }
          />
        </div>
      </div>

      {!transactions ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-8 text-center">
          <Receipt className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
        </div>
      ) : (
        <>
        <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                {showSource ? <TableHead>Source</TableHead> : null}
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id} data-state={selectedIds.has(tx.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox checked={selectedIds.has(tx.id)} onCheckedChange={() => toggleOne(tx.id)} />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-tabular">{tx.reference}</p>
                    <p className="text-xs text-muted-foreground">{tx.userName}</p>
                  </TableCell>
                  <TableCell>{formatLabel(tx.type)}</TableCell>
                  {showSource ? <TableCell className="text-muted-foreground">{sourceLabel(tx)}</TableCell> : null}
                  <TableCell className="text-tabular">
                    <TransactionAmount
                      amount={tx.amount}
                      currencySymbol={tx.currencySymbol}
                      usdEquivalent={tx.usdEquivalent}
                    type={tx.type}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusEditButton
                      value={tx.status}
                      options={STATUS_STYLES}
                      onChange={(next) => changeStatus(tx.id, next)}
                      disabled={tx.status !== "PENDING"}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tx.destinationAddress ?? "None"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(tx.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {selectedIds.size > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-hairline bg-surface p-4">
            <span className="mr-1 text-sm font-medium">{selectedIds.size} selected</span>
            <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
              <AlertDialogTrigger render={<Button size="sm" variant="destructive">Delete</Button>} />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {selectedIds.size} transaction{selectedIds.size === 1 ? "" : "s"}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the record only, wallet balances are not adjusted. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={bulkDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : null}
        </>
      )}
    </div>
  );
}

export default function AdminLedgerPage() {
  return (
    <Suspense>
      <LedgerContent />
    </Suspense>
  );
}
