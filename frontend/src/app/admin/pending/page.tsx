"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, type AdminUser } from "@/lib/admin-api";
import { ApiError } from "@/lib/dashboard-api";
import { formatDate } from "@/lib/utils";

export default function AdminPendingPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const load = useCallback(() => {
    adminApi.users().then(setUsers);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = (users ?? []).filter((u) => u.status === "AWAITING");

  async function approve(id: string) {
    setApprovingId(id);
    try {
      await adminApi.setUserStatus(id, "ACTIVE");
      toast.success("Account approved");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not approve account");
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pending approvals</h1>
        <p className="mt-1 text-base text-muted-foreground">
          New accounts waiting to be approved. Until approved they cannot deposit, withdraw, subscribe, or
          trade, and cannot see any deposit address.
        </p>
      </div>

      {!users ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-8 text-center">
          <UserCheck className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nothing pending. Every account is approved.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-hairline bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="cursor-pointer font-medium" onClick={() => router.push(`/admin/users/detail?userId=${user.id}`)}>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      className="brand-gradient text-background hover:opacity-90"
                      onClick={() => approve(user.id)}
                      disabled={approvingId === user.id}
                    >
                      Approve
                    </Button>
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
