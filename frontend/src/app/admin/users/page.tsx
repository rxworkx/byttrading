"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, type AdminUser, type UserStatus } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/utils";
import { useRowSelection } from "@/lib/use-row-selection";

const STATUS_STYLES: Record<AdminUser["status"], string> = {
  AWAITING: "bg-status-warning/15 text-status-warning",
  ACTIVE: "bg-status-good/15 text-status-good",
  SUSPENDED: "bg-destructive/15 text-destructive",
  DISABLED: "bg-secondary text-muted-foreground",
};

const STATUS_LABELS: Record<AdminUser["status"], string> = {
  AWAITING: "Awaiting",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  DISABLED: "Disabled",
};

const BULK_STATUS_BUTTONS: { value: UserStatus; label: string; className: string }[] = [
  { value: "ACTIVE", label: "Set Active", className: "bg-status-good text-white hover:opacity-90" },
  { value: "AWAITING", label: "Set Awaiting", className: "bg-status-warning text-white hover:opacity-90" },
  { value: "SUSPENDED", label: "Set Suspended", className: "bg-destructive text-white hover:opacity-90" },
  { value: "DISABLED", label: "Set Disabled", className: "bg-foreground text-background hover:opacity-90" },
];

function verificationsLabel(user: AdminUser) {
  const parts: string[] = [];
  if (user.isEmailVerified) parts.push("Email");
  if (user.kycStatus === "APPROVED") parts.push("Kyc");
  return parts.length > 0 ? parts.join(" | ") : "Unverified";
}

function formatUsd(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Every bulk action here loops single-item admin endpoints (there is no
// bulk endpoint anywhere in this backend) and reports how many of the
// selection actually succeeded, since a partial failure (e.g. an active
// trade blocking a delete elsewhere) is an expected, meaningful outcome,
// not a bug to hide.
async function runBulk(ids: string[], action: (id: string) => Promise<unknown>, verb: string) {
  const results = await Promise.allSettled(ids.map(action));
  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - succeeded;
  if (succeeded > 0) toast.success(`${verb} ${succeeded} user${succeeded === 1 ? "" : "s"}`);
  if (failed > 0) toast.error(`${failed} user${failed === 1 ? "" : "s"} could not be ${verb.toLowerCase()}`);
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { selectedIds, toggleOne, toggleAll, isAllSelected, clear } = useRowSelection(
    users?.map((u) => u.id) ?? [],
  );

  const load = useCallback(() => {
    adminApi.users().then(setUsers);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function bulkSetStatus(status: UserStatus) {
    const ids = Array.from(selectedIds);
    await runBulk(ids, (id) => adminApi.setUserStatus(id, status), "Updated");
    clear();
    load();
  }

  async function bulkDelete() {
    const ids = Array.from(selectedIds);
    setConfirmDeleteOpen(false);
    await runBulk(ids, (id) => adminApi.deleteUser(id), "Deleted");
    clear();
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-base text-muted-foreground">Every account on BYT Trading, newest first.</p>
      </div>

      {!users ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                      User
                    </div>
                  </TableHead>
                  <TableHead>Amounts</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer"
                    data-state={selectedIds.has(user.id) ? "selected" : undefined}
                    onClick={() => router.push(`/admin/users/detail?userId=${user.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <span onClick={(e) => e.stopPropagation()} className="pt-0.5">
                          <Checkbox checked={selectedIds.has(user.id)} onCheckedChange={() => toggleOne(user.id)} />
                        </span>
                        <div>
                          <div className="font-medium text-foreground">
                            {user.firstName} {user.lastName} | {user.referralCode}
                          </div>
                          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                            <p>{user.email}</p>
                            <p>Verification: {verificationsLabel(user)}</p>
                            <p className="flex items-center gap-1.5">
                              Status:
                              <Badge className={`border-0 ${STATUS_STYLES[user.status]}`}>
                                {STATUS_LABELS[user.status]}
                              </Badge>
                            </p>
                            <p>Last login: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}</p>
                            <p>Joined: {formatDateTime(user.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-tabular">
                      <div className="space-y-0.5 text-xs">
                        <p>
                          <span className="text-muted-foreground">Balance </span>
                          {formatUsd(user.balanceUsd)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Deposits </span>
                          {formatUsd(user.depositsUsd)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Withdrawals </span>
                          {formatUsd(user.withdrawalsUsd)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Commission </span>
                          {formatUsd(user.referralCommissionUsd)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Trade volume </span>
                          {formatUsd(user.tradesUsd)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Active trades </span>
                          {formatUsd(user.activeTradesUsd)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Earnings </span>
                          {formatUsd(user.earningsUsd)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-start gap-1.5">
                        <Button
                          size="xs"
                          className="rounded-sm brand-gradient text-background hover:opacity-90"
                          nativeButton={false}
                          render={<Link href={`/admin/users/detail?userId=${user.id}`}>Edit</Link>}
                        />
                        <Button
                          size="xs"
                          variant="ghost"
                          className="rounded-sm bg-status-good text-white hover:bg-status-good hover:text-white hover:opacity-90"
                          nativeButton={false}
                          render={<Link href={`/admin/users/funds?userId=${user.id}`}>Funds</Link>}
                        />
                        <Button
                          size="xs"
                          variant="ghost"
                          className="rounded-sm bg-gray-700 text-white hover:bg-gray-700 hover:text-white hover:opacity-90"
                          nativeButton={false}
                          render={<Link href={`/admin/send-notification?userId=${user.id}`}>Email</Link>}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {selectedIds.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-hairline bg-surface p-4">
              <span className="mr-1 text-sm font-medium">{selectedIds.size} selected</span>
              {BULK_STATUS_BUTTONS.map((btn) => (
                <Button key={btn.value} size="sm" className={btn.className} onClick={() => bulkSetStatus(btn.value)}>
                  {btn.label}
                </Button>
              ))}
              <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                <AlertDialogTrigger render={<Button size="sm" variant="destructive">Delete</Button>} />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedIds.size} user{selectedIds.size === 1 ? "" : "s"}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently erases their wallets, transactions, trades, and KYC records. This cannot be
                      undone.
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
