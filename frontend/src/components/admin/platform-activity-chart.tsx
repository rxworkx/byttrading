"use client";

import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AdminDailyActivity } from "@/lib/admin-api";

const views = [
  { key: "overview", label: "Overview" },
  { key: "deposits", label: "Transactions" },
  { key: "trades", label: "Trades" },
  { key: "profit", label: "Profit" },
] as const;

type ViewKey = (typeof views)[number]["key"];

// One color per metric, reused across every view so a metric always reads
// the same regardless of which tab it shows up on. Trades uses a plain hex
// blue rather than the teal --primary, which reads too close to the emerald
// used for deposits.
const COLORS = {
  deposits: "var(--brand-emerald)",
  withdrawals: "var(--status-critical)",
  profit: "var(--status-warning)",
  trades: "#3b82f6",
};

const fullConfig = {
  deposits: { label: "Deposits", color: COLORS.deposits },
  withdrawals: { label: "Withdrawals", color: COLORS.withdrawals },
  profit: { label: "Profit credited", color: COLORS.profit },
  trades: { label: "Trades placed", color: COLORS.trades },
} satisfies ChartConfig;

const hasDataFor: Record<ViewKey, (d: AdminDailyActivity) => boolean> = {
  overview: (d) => d.deposits > 0 || d.withdrawals > 0 || d.profit > 0 || d.trades > 0,
  deposits: (d) => d.deposits > 0 || d.withdrawals > 0,
  trades: (d) => d.trades > 0,
  profit: (d) => d.profit > 0,
};

const emptyLabel: Record<ViewKey, string> = {
  overview: "platform activity",
  deposits: "deposits or withdrawals",
  trades: "trades placed",
  profit: "profit credited",
};

export function PlatformActivityChart({ data }: { data: AdminDailyActivity[] }) {
  const [view, setView] = useState<ViewKey>("overview");

  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  const hasData = data.some(hasDataFor[view]);

  return (
    <Card className="border-hairline bg-surface">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Platform activity, last 14 days</CardTitle>
        <CardAction>
          <Tabs value={view} onValueChange={(v) => v && setView(v as ViewKey)}>
            <TabsList>
              {views.map((v) => (
                <TabsTrigger key={v.key} value={v.key}>
                  {v.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={fullConfig} className="h-64 w-full">
          {view === "overview" ? (
            // Trades is a count, everything else is USD, so trades gets its
            // own right axis line instead of getting lost next to dollar bars.
            <ComposedChart data={chartData}>
              <CartesianGrid vertical={false} stroke="var(--hairline)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis yAxisId="usd" hide />
              <YAxis yAxisId="count" orientation="right" hide allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar yAxisId="usd" dataKey="deposits" fill="var(--color-deposits)" radius={4} />
              <Bar yAxisId="usd" dataKey="withdrawals" fill="var(--color-withdrawals)" radius={4} />
              <Bar yAxisId="usd" dataKey="profit" fill="var(--color-profit)" radius={4} />
              <Line
                yAxisId="count"
                dataKey="trades"
                type="monotone"
                stroke="var(--color-trades)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-trades)" }}
              />
            </ComposedChart>
          ) : view === "deposits" ? (
            <ComposedChart data={chartData}>
              <CartesianGrid vertical={false} stroke="var(--hairline)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="deposits" fill="var(--color-deposits)" radius={4} />
              <Bar dataKey="withdrawals" fill="var(--color-withdrawals)" radius={4} />
            </ComposedChart>
          ) : view === "trades" ? (
            <ComposedChart data={chartData}>
              <CartesianGrid vertical={false} stroke="var(--hairline)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis hide allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="trades" fill="var(--color-trades)" radius={4} />
            </ComposedChart>
          ) : (
            <ComposedChart data={chartData}>
              <CartesianGrid vertical={false} stroke="var(--hairline)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
            </ComposedChart>
          )}
        </ChartContainer>

        {!hasData ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">No {emptyLabel[view]} in the last 14 days yet.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
