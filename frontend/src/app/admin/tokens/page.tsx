"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminAssetsApi,
  adminDepositAddressesApi,
  type AdminAsset,
  type AdminDepositAddress,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/dashboard-api";
import { assetIconSrc } from "@/lib/asset-labels";
import { formatDateTime } from "@/lib/utils";

interface TokenRowData extends AdminAsset {
  address: string | null;
  addressUpdatedAt: string | null;
}

function PriceBadge({ price, priceChange }: { price: string | null; priceChange: string | null }) {
  if (price == null) return null;
  const change = priceChange == null ? null : Number(priceChange);
  return (
    <div className="text-right">
      <p className="text-tabular text-sm font-semibold">
        ${Number(price).toLocaleString(undefined, { maximumFractionDigits: 6 })}
      </p>
      {change != null ? (
        <p
          className={`text-tabular text-xs font-medium ${
            change >= 0 ? "text-status-good" : "text-status-critical"
          }`}
        >
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}% 24h
        </p>
      ) : null}
    </div>
  );
}

function TokenRow({ token, onSaved }: { token: TokenRowData; onSaved: () => void }) {
  const [address, setAddress] = useState(token.address ?? "");
  const [enabled, setEnabled] = useState(token.enabled);
  const [showInWalletList, setShowInWalletList] = useState(token.showInWalletList);
  const [sortOrder, setSortOrder] = useState(String(token.sortOrder));
  const [saving, setSaving] = useState(false);
  const icon = assetIconSrc(token.symbol);

  const dirty =
    address !== (token.address ?? "") ||
    enabled !== token.enabled ||
    showInWalletList !== token.showInWalletList ||
    Number(sortOrder) !== token.sortOrder;

  async function save() {
    setSaving(true);
    try {
      await Promise.all([
        address !== (token.address ?? "")
          ? adminDepositAddressesApi.setAddress(token.symbol, address)
          : Promise.resolve(),
        enabled !== token.enabled ||
        showInWalletList !== token.showInWalletList ||
        Number(sortOrder) !== token.sortOrder
          ? adminAssetsApi.update(token.symbol, {
              enabled,
              showInWalletList,
              sortOrder: Number(sortOrder),
            })
          : Promise.resolve(),
      ]);
      toast.success(`${token.name} updated`);
      onSaved();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save token");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Field>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={token.symbol} className="flex items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">
            {icon ? (
              <Image src={icon} alt="" width={16} height={16} className="size-4 object-contain" />
            ) : null}
          </span>
          {token.name} ({token.symbol.toUpperCase()})
        </FieldLabel>
        <PriceBadge price={token.price} priceChange={token.priceChange} />
      </div>

      <div className="flex items-center gap-2">
        <Input
          id={token.symbol}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="No address set"
          className="flex-1"
        />
        <Button size="sm" onClick={save} disabled={!dirty || saving}>
          Save
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={enabled} onCheckedChange={(checked) => setEnabled(checked === true)} />
          Enabled
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={showInWalletList}
            onCheckedChange={(checked) => setShowInWalletList(checked === true)}
          />
          Listed in wallet picker
        </label>
        <label className="flex items-center gap-2 text-sm">
          Sort
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="h-8 w-20"
          />
        </label>
      </div>

      {token.addressUpdatedAt ? (
        <FieldDescription>Address last updated {formatDateTime(token.addressUpdatedAt)}</FieldDescription>
      ) : null}
    </Field>
  );
}

export default function AdminTokensPage() {
  const [tokens, setTokens] = useState<TokenRowData[] | null>(null);

  const load = useCallback(() => {
    Promise.all([adminAssetsApi.list(), adminDepositAddressesApi.list()]).then(
      ([assets, addresses]: [AdminAsset[], AdminDepositAddress[]]) => {
        const addressBySymbol = new Map(addresses.map((row) => [row.symbol, row]));
        setTokens(
          assets.map((asset) => {
            const address = addressBySymbol.get(asset.symbol);
            return {
              ...asset,
              address: address?.address ?? null,
              addressUpdatedAt: address?.updatedAt ?? null,
            };
          }),
        );
      },
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tokens</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Every asset supported on BYT Trading, with its shared deposit address, live price, and wallet picker
          settings. Users see the deposit address on their deposit page and QR code, unless they have a personal
          override set from their user detail page. Disabling a token pauses its price refresh and blocks new
          wallets in it, existing balances keep working. Unlisting only hides it from users who don&apos;t already
          hold it.
        </p>
      </div>

      {!tokens ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-5 rounded-2xl border border-hairline bg-surface p-6">
          {tokens.map((token) => (
            <TokenRow key={token.symbol} token={token} onSaved={load} />
          ))}
        </div>
      )}
    </div>
  );
}
