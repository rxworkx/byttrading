"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminSubscriptionsApi, type AdminSubscription } from "@/lib/admin-api";
import { formatDateTime, formatLabel } from "@/lib/utils";

const statusStyles: Record<AdminSubscription["status"], string> = {
  ACTIVE: "bg-status-good/15 text-status-good",
  EXPIRED: "bg-secondary text-muted-foreground",
  CANCELLED: "bg-destructive/15 text-destructive",
};

function SubscriptionsContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? undefined;
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[] | null>(null);

  useEffect(() => {
    adminSubscriptionsApi.list(userId).then(setSubscriptions);
  }, [userId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Subscriptions</h1>
        <p className="mt-1 text-base text-muted-foreground">
          {userId ? "Bot subscriptions for this user." : "Every bot subscription across all users."}
        </p>
      </div>

      {!subscriptions ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-8 text-center">
          <Users className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <p className="font-medium">{sub.userName}</p>
                    <p className="text-xs text-muted-foreground">{sub.userEmail}</p>
                  </TableCell>
                  <TableCell className="font-medium">{sub.planName}</TableCell>
                  <TableCell>{formatLabel(sub.term)}</TableCell>
                  <TableCell className="text-tabular">${Number(sub.feePaidUsd).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={`border-0 ${statusStyles[sub.status]}`}>{formatLabel(sub.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(sub.startedAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(sub.expiresAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function AdminSubscriptionsPage() {
  return (
    <Suspense>
      <SubscriptionsContent />
    </Suspense>
  );
}
