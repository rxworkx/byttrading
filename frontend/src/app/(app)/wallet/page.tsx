"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { walletsApi, type Wallet } from "@/lib/dashboard-api";
import { assetIconSrc, currencyLabel, sortWalletsFiatLast } from "@/lib/asset-labels";

export default function WalletPage() {
  const [wallets, setWallets] = useState<Wallet[] | null>(null);

  useEffect(() => {
    walletsApi.list().then((data) => setWallets(sortWalletsFiatLast(data)));
  }, []);

  const totalUsd = (wallets ?? []).reduce((sum, w) => sum + Number(w.usdValue || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Wallet</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Every asset you hold on BYT Trading, priced live, in one place.
        </p>
      </div>

      <div className="rounded-2xl border border-hairline brand-gradient p-5 text-background">
        <p className="text-sm text-background/80">Wallet balance</p>
        {!wallets ? (
          <Skeleton className="mt-2 h-8 w-40 bg-background/30" />
        ) : (
          <p className="text-tabular mt-2 text-3xl font-semibold">
            ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="h-auto flex-col gap-1.5 py-4"
          nativeButton={false}
          render={
            <Link href="/wallet/deposit">
              <ArrowDownToLine className="size-4" /> Add Fund
            </Link>
          }
        />
        <Button
          variant="outline"
          className="h-auto flex-col gap-1.5 py-4"
          nativeButton={false}
          render={
            <Link href="/wallet/withdraw">
              <ArrowUpFromLine className="size-4" /> Withdraw
            </Link>
          }
        />
        <Button
          variant="outline"
          className="h-auto flex-col gap-1.5 py-4"
          nativeButton={false}
          render={
            <Link href="/wallet/transfer">
              <ArrowLeftRight className="size-4" /> Transfer
            </Link>
          }
        />
      </div>

      <div className="space-y-2">
        {!wallets
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          : wallets.map((wallet) => {
              const icon = assetIconSrc(wallet.symbol);
              return (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between rounded-xl border border-hairline bg-surface p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">
                      {icon ? (
                        <Image src={icon} alt={wallet.name} width={24} height={24} className="size-6 object-contain" />
                      ) : (
                        <WalletIcon className="size-5 text-muted-foreground" />
                      )}
                    </span>
                    <div>
                      <p className="font-medium">{wallet.name}</p>
                      <p className="text-xs text-muted-foreground">{currencyLabel(wallet.symbol)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-tabular font-semibold">
                      {Number(wallet.balance).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </p>
                    <p className="text-tabular text-xs text-muted-foreground">${wallet.usdValue}</p>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
