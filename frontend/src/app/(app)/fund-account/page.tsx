"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDownToLine, Coins, ExternalLink, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { walletsApi, type Wallet } from "@/lib/dashboard-api";
import { siteConfig } from "@/lib/site-config";

export default function FundAccountPage() {
  const [wallets, setWallets] = useState<Wallet[] | null>(null);

  useEffect(() => {
    walletsApi.list().then(setWallets);
  }, []);

  const totalUsd = (wallets ?? []).reduce((sum, w) => sum + Number(w.usdValue || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Fund account</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Bring money into BYT Trading, then place a trade straight from whichever wallet holds it.
          Every step here maps to a real balance you can see under Wallet.
        </p>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-5">
        <p className="text-xs text-muted-foreground">Available balance</p>
        {!wallets ? (
          <Skeleton className="mt-2 h-8 w-32" />
        ) : (
          <p className="text-tabular mt-2 text-2xl font-semibold">
            ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-6">
          <span className="flex size-11 items-center justify-center rounded-xl brand-gradient text-background">
            <ArrowDownToLine className="size-5" />
          </span>
          <div>
            <p className="font-semibold">1. Add fund</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Send crypto to your personal deposit address. It lands in your wallet once confirmed.
            </p>
          </div>
          <Button className="mt-auto w-full" variant="outline" nativeButton={false} render={<Link href="/wallet/deposit">Add fund</Link>} />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-6">
          <span className="flex size-11 items-center justify-center rounded-xl brand-gradient text-background">
            <TrendingUp className="size-5" />
          </span>
          <div>
            <p className="font-semibold">2. Place a trade</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a subscribed bot, choose which wallet funds it, and set an amount. It is debited from
              that wallet and locked for the bot&apos;s cycle.
            </p>
          </div>
          <Button className="mt-auto w-full brand-gradient text-background hover:opacity-90" nativeButton={false} render={<Link href="/trading">Go to trading</Link>} />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-6">
          <span className="flex size-11 items-center justify-center rounded-xl brand-gradient text-background">
            <Coins className="size-5" />
          </span>
          <div>
            <p className="font-semibold">No crypto yet?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Buy crypto with a card or bank transfer through our trusted on ramp partner, then add it to
              your wallet.
            </p>
          </div>
          <Button className="mt-auto w-full" variant="outline" nativeButton={false} render={
            <a href={siteConfig.buyCryptoUrl} target="_blank" rel="noreferrer">
              Buy crypto <ExternalLink className="ml-1 size-4" />
            </a>
          } />
        </div>
      </div>
    </div>
  );
}
