"use client";

import { useEffect, useState } from "react";
import { ASSET_LABELS } from "@/lib/asset-labels";

interface PriceEntry {
  usdPrice: number;
  fetchedAt: string;
}

export function LivePriceFeed({ limit }: { limit?: number } = {}) {
  const [prices, setPrices] = useState<Record<string, PriceEntry> | null>(null);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    const load = () => fetch(`${API_URL}/prices`).then((r) => r.json()).then(setPrices);
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Live Trading Feed</p>
        <span className="flex items-center gap-1.5 rounded-full bg-status-good/15 px-2 py-0.5 text-xs text-status-good">
          <span className="size-1.5 rounded-full bg-status-good" /> LIVE
        </span>
      </div>

      <div className="mt-4 divide-y divide-hairline">
        {!prices
          ? Array.from({ length: limit ?? 4 }).map((_, i) => <div key={i} className="h-10 animate-pulse" />)
          : Object.entries(prices).slice(0, limit).map(([apiId, entry]) => (
              <div key={apiId} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{ASSET_LABELS[apiId] ?? apiId}/USD</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.fetchedAt).toLocaleTimeString()}
                  </p>
                </div>
                <span className="text-tabular font-semibold">
                  ${entry.usdPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </span>
              </div>
            ))}
      </div>
    </div>
  );
}
