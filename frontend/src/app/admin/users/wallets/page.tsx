"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  adminApi,
  adminUserDepositAddressesApi,
  type AdminUserDetail,
  type AdminUserDepositAddress,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/dashboard-api";
import { currencyLabel } from "@/lib/asset-labels";

function UserAddressRow({
  userId,
  asset,
  onSaved,
}: {
  userId: string;
  asset: AdminUserDepositAddress;
  onSaved: () => void;
}) {
  const [address, setAddress] = useState(asset.address ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = address !== (asset.address ?? "");

  async function save() {
    setSaving(true);
    try {
      await adminUserDepositAddressesApi.setAddress(userId, asset.symbol, address);
      toast.success(`${asset.name} address updated`);
      onSaved();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save address");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Field>
      <FieldLabel htmlFor={`user-addr-${asset.symbol}`}>
        {asset.name} ({asset.symbol.toUpperCase()})
      </FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          id={`user-addr-${asset.symbol}`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Using shared default"
          className="flex-1"
        />
        <Button size="sm" onClick={save} disabled={!dirty || saving}>
          Save
        </Button>
      </div>
      <FieldDescription>
        {asset.isOverride ? "Custom address for this user." : "Using the shared default address."}
      </FieldDescription>
    </Field>
  );
}

function AdminUserWalletsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("userId") ?? "";
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [addresses, setAddresses] = useState<AdminUserDepositAddress[] | null>(null);

  const load = useCallback(() => {
    adminApi.userDetail(id).then(setDetail);
  }, [id]);

  const loadAddresses = useCallback(() => {
    adminUserDepositAddressesApi.list(id).then(setAddresses);
  }, [id]);

  useEffect(() => {
    load();
    loadAddresses();
  }, [load, loadAddresses]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/users/detail?userId=${id}`}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to user
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">
          {detail ? `${detail.user.firstName} ${detail.user.lastName}'s wallets` : "Wallets"}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">Wallet balances and per-asset deposit addresses for this user.</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Wallet balances</h2>
        {!detail ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-hairline bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>USD value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.wallets.map((wallet) => (
                  <TableRow key={wallet.id}>
                    <TableCell className="font-medium">
                      {wallet.name} <span className="text-xs text-muted-foreground">{currencyLabel(wallet.symbol)}</span>
                    </TableCell>
                    <TableCell className="text-tabular">
                      {Number(wallet.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </TableCell>
                    <TableCell className="text-tabular">${wallet.usdValue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Deposit addresses</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a personal address for this user on a specific asset. Anything left blank falls back to the
          shared default address for that asset.
        </p>
        {!addresses ? (
          <div className="mt-3 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="mt-3 space-y-5 rounded-2xl border border-hairline bg-surface p-6">
            {addresses.map((asset) => (
              <UserAddressRow key={asset.symbol} userId={id} asset={asset} onSaved={loadAddresses} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminUserWalletsPage() {
  return (
    <Suspense>
      <AdminUserWalletsContent />
    </Suspense>
  );
}
