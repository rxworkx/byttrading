"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Transaction } from "@/lib/dashboard-api";

const chartConfig = {
  cumulative: { label: "Cumulative profit", color: "var(--brand-emerald)" },
} satisfies ChartConfig;

const periods = [
  { key: "7", label: "Week" },
  { key: "30", label: "Month" },
  { key: "90", label: "3M" },
  { key: "180", label: "6M" },
  { key: "365", label: "Year" },
  { key: "36500", label: "All" },
];

export function PerformanceChart({ transactions }: { transactions: Transaction[] }) {
  const [period, setPeriod] = useState("7");

  const data = useMemo(() => {
    const days = Number(period);
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - days);

    const profitTx = transactions
      .filter((tx) => tx.type === "PROFIT_CREDIT" && new Date(tx.createdAt) >= start)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return profitTx.reduce<{ date: string; cumulative: number }[]>((acc, tx) => {
      const previous = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
      const cumulative = Math.round((previous + Number(tx.usdEquivalent ?? tx.amount)) * 100) / 100;
      acc.push({
        date: new Date(tx.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        cumulative,
      });
      return acc;
    }, []);
  }, [transactions, period]);

  return (
    <div>
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList>
          {periods.map((p) => (
            <TabsTrigger key={p.key} value={p.key}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fillCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-cumulative)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-cumulative)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--hairline)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="cumulative"
                type="monotone"
                fill="url(#fillCumulative)"
                stroke="var(--color-cumulative)"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No completed trade cycles in this period yet.
          </p>
        )}
      </div>
    </div>
  );
}
