"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusEditButton, type StatusOption } from "@/components/admin/status-edit-button";
import { adminInvestmentsApi, type AdminInvestment } from "@/lib/admin-api";
import { ApiError } from "@/lib/dashboard-api";
import { formatDateTime, formatLabel } from "@/lib/utils";
import { useRowSelection } from "@/lib/use-row-selection";

const TRADE_STATUS_OPTIONS: StatusOption[] = [
  { value: "AWAITING", label: "Awaiting", className: "bg-status-warning/15 text-status-warning" },
  { value: "ACTIVE", label: "Active", className: "bg-secondary text-foreground" },
  { value: "COMPLETED", label: "Completed", className: "bg-status-good/15 text-status-good" },
  { value: "CANCELLED", label: "Cancelled", className: "bg-destructive/15 text-destructive" },
];

const statusClassName: Record<AdminInvestment["status"], string> = {
  AWAITING: "bg-status-warning/15 text-status-warning",
  ACTIVE: "bg-secondary text-foreground",
  LOCKED: "bg-secondary text-foreground",
  COMPLETED: "bg-status-good/15 text-status-good",
  CANCELLED: "bg-destructive/15 text-destructive",
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "active", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function expiryLabel(inv: AdminInvestment) {
  if (!inv.endDate) return "";
  const msRemaining = new Date(inv.endDate).getTime() - Date.now();
  if (msRemaining <= 0) return "Expired";
  const days = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
  return days === 1 ? "1 day" : `${days} days`;
}

// Credits profit right away, either as a rate against the current locked
// amount or a direct USD amount, instead of waiting for the scheduled
// accrual, which can be days out on a weekly or longer cycle.
function AccrueProfitButton({ investmentId, onAccrued }: { investmentId: string; onAccrued: () => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"rate" | "amount">("rate");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const value = mode === "rate" ? rate : amount;

  async function submit() {
    if (!value) return;
    setSubmitting(true);
    try {
      await adminInvestmentsApi.accrue(
        investmentId,
        mode === "rate" ? { ratePercent: rate } : { amount },
      );
      toast.success("Profit credited");
      setRate("");
      setAmount("");
      setOpen(false);
      onAccrued();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not credit profit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
            Add profit
          </Button>
        }
      />
      <PopoverContent className="w-56">
        <p className="text-sm font-medium">Credit profit now</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "rate"
            ? "Applies this rate to the current locked amount immediately."
            : "Credits this exact USD amount immediately."}
        </p>
        <div className="mt-3 flex gap-1 rounded-lg bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setMode("rate")}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              mode === "rate" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Rate %
          </button>
          <button
            type="button"
            onClick={() => setMode("amount")}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              mode === "amount" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Amount USD
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Input
            inputMode="decimal"
            placeholder={mode === "rate" ? "Rate %" : "Amount USD"}
            value={value}
            onChange={(e) => (mode === "rate" ? setRate(e.target.value) : setAmount(e.target.value))}
            className="h-9"
          />
          <Button size="sm" onClick={submit} disabled={!value || submitting}>
            {submitting ? "Adding…" : "Add"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TradingsContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? undefined;
  const [status, setStatus] = useState(searchParams.get("status") ?? "ALL");
  const [investments, setInvestments] = useState<AdminInvestment[] | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { selectedIds, toggleOne, toggleAll, isAllSelected, clear } = useRowSelection(
    investments?.map((inv) => inv.id) ?? [],
  );

  const load = useCallback(() => {
    adminInvestmentsApi
      .list(status === "ALL" ? undefined : (status as "active" | "COMPLETED" | "CANCELLED"), userId)
      .then(setInvestments);
  }, [status, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const isActiveView = status === "active";

  async function changeStatus(id: string, next: string) {
    try {
      await adminInvestmentsApi.setStatus(id, next as AdminInvestment["status"]);
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update trade status");
    }
  }

  async function bulkDelete() {
    const ids = Array.from(selectedIds);
    setConfirmDeleteOpen(false);
    const results = await Promise.allSettled(ids.map((id) => adminInvestmentsApi.delete(id)));
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;
    if (succeeded > 0) toast.success(`Deleted ${succeeded} trade${succeeded === 1 ? "" : "s"}`);
    if (failed > 0) toast.error(`${failed} trade${failed === 1 ? "" : "s"} could not be deleted`);
    clear();
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{isActiveView ? "Active trades" : "Tradings"}</h1>
          <p className="mt-1 text-base text-muted-foreground">
            {userId
              ? "Trades for this user."
              : isActiveView
                ? "Every trade currently active or awaiting approval across all users."
                : "Every trade ever placed across all users, any status."}
          </p>
        </div>
        <Select value={status} onValueChange={(v) => v && setStatus(v)}>
          <SelectTrigger className="w-44">
            <SelectValue>{STATUS_OPTIONS.find((o) => o.value === status)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!investments ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : investments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-8 text-center">
          <TrendingUp className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No trades to show.</p>
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
                <TableHead>Amount</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Profit</TableHead>
                {isActiveView ? <TableHead>Expiry</TableHead> : <TableHead>End Date</TableHead>}
                <TableHead>Start Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map((inv) => (
                <TableRow key={inv.id} data-state={selectedIds.has(inv.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox checked={selectedIds.has(inv.id)} onCheckedChange={() => toggleOne(inv.id)} />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-tabular">{inv.reference}</p>
                    <p className="text-xs text-muted-foreground">{inv.userName}</p>
                  </TableCell>
                  <TableCell className="text-tabular">${Number(inv.principal).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{inv.planName}</TableCell>
                  <TableCell>
                    {isActiveView ? (
                      <StatusEditButton
                        value={inv.status}
                        options={TRADE_STATUS_OPTIONS}
                        onChange={(next) => changeStatus(inv.id, next)}
                        disabled={inv.status === "COMPLETED" || inv.status === "CANCELLED"}
                      />
                    ) : (
                      <span className={`inline-flex rounded-full border-0 px-2.5 py-0.5 text-xs font-medium ${statusClassName[inv.status]}`}>
                        {formatLabel(inv.status)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-tabular text-status-good">
                    <div className="flex items-center gap-2">
                      <span>+${Number(inv.profitAccrued).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      {isActiveView && inv.status === "ACTIVE" ? (
                        <AccrueProfitButton investmentId={inv.id} onAccrued={load} />
                      ) : null}
                    </div>
                  </TableCell>
                  {isActiveView ? (
                    <TableCell className="text-muted-foreground">{expiryLabel(inv)}</TableCell>
                  ) : (
                    <TableCell className="text-muted-foreground">
                      {inv.endDate ? formatDateTime(inv.endDate) : ""}
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">{formatDateTime(inv.startDate)}</TableCell>
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
                    Delete {selectedIds.size} trade{selectedIds.size === 1 ? "" : "s"}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Only completed or cancelled trades can be deleted. Linked transactions are kept for the
                    record. This cannot be undone.
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

export default function AdminTradingsPage() {
  return (
    <Suspense>
      <TradingsContent />
    </Suspense>
  );
}
