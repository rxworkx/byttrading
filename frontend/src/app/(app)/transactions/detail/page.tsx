"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { transactionsApi, type Transaction } from "@/lib/dashboard-api";
import { CopyButton } from "@/components/shared/copy-button";
import { currencyLabel } from "@/lib/asset-labels";
import { formatDateTime, formatLabel } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  COMPLETED: "bg-status-good/15 text-status-good",
  PENDING: "bg-status-warning/15 text-status-warning",
  CANCELLED: "bg-destructive/15 text-destructive",
};

function TransactionDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [tx, setTx] = useState<Transaction | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    transactionsApi
      .get(id)
      .then(setTx)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm text-muted-foreground">That transaction could not be found.</p>
        <Link href="/transactions" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
          Back to transactions
        </Link>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const isDeposit = tx.type === "DEPOSIT";
  const isWithdrawal = tx.type === "WITHDRAWAL";
  const isPending = tx.status === "PENDING";
  const displayAddress = tx.destinationAddress;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/transactions" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to transactions
      </Link>

      {isPending && isDeposit ? (
        <div className="rounded-2xl border border-hairline bg-surface p-6 text-center">
          <h2 className="font-semibold">Complete your payment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Send exactly {Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })}{" "}
            {currencyLabel(tx.currencySymbol)} to the address below.
          </p>
          {tx.destinationAddress ? (
            <>
              <div className="mx-auto mt-4 flex w-fit items-center justify-center rounded-xl border border-hairline bg-background p-4">
                <QRCodeSVG value={tx.destinationAddress} size={176} />
              </div>
              <div className="text-tabular mt-4 flex items-center justify-center gap-2 break-all rounded-lg border border-hairline bg-secondary p-3 text-sm">
                <span>{tx.destinationAddress}</span>
                <CopyButton value={tx.destinationAddress} />
              </div>
            </>
          ) : (
            <p className="mt-4 rounded-lg border border-hairline bg-secondary p-3 text-xs text-muted-foreground">
              No deposit address was on file when this was submitted. Contact support with your reference number.
            </p>
          )}
        </div>
      ) : null}

      {isPending && isWithdrawal ? (
        <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-6">
          <Clock className="size-5 shrink-0 text-status-warning" />
          <p className="text-sm text-muted-foreground">
            Awaiting admin review. Your balance was already debited and will be refunded automatically if this
            is rejected.
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-hairline bg-surface p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Reference</p>
            <p className="text-tabular text-lg font-semibold">{tx.reference}</p>
          </div>
          <Badge className={`border-0 ${statusStyles[tx.status] ?? "bg-secondary text-foreground"}`}>
            {formatLabel(tx.status)}
          </Badge>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-hairline pt-6 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Type</dt>
            <dd className="mt-0.5 font-medium">{formatLabel(tx.type)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Amount</dt>
            <dd className="text-tabular mt-0.5 font-medium">
              {Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })} {currencyLabel(tx.currencySymbol)}
            </dd>
            {tx.usdEquivalent ? (
              <dd className="text-tabular mt-0.5 text-xs text-muted-foreground">
                {Number(tx.usdEquivalent).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
              </dd>
            ) : null}
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Created</dt>
            <dd className="mt-0.5 font-medium">{formatDateTime(tx.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Confirmed</dt>
            <dd className="mt-0.5 font-medium">{tx.confirmedAt ? formatDateTime(tx.confirmedAt) : "Not yet"}</dd>
          </div>
          {displayAddress ? (
            <div className="col-span-2 flex flex-wrap items-baseline gap-2">
              <dt className="shrink-0 text-xs text-muted-foreground">Address</dt>
              <dd className="text-tabular flex items-center gap-1 break-all font-medium">
                <span>{displayAddress}</span>
                <CopyButton value={displayAddress} />
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}

export default function TransactionDetailPage() {
  return (
    <Suspense>
      <TransactionDetailContent />
    </Suspense>
  );
}
