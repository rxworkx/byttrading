"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Investment, Transaction } from "@/lib/dashboard-api";

// Both series are in USD, so one shared axis is correct here (the "never
// dual-axis" rule is about two different scales/units, not about plotting
// two same-unit series together). Two real series get two categorical
// colors; a per-month rainbow would just decorate what the x-axis position
// already says unambiguously. Profit reuses the app's existing green
// "status-good" convention; volume gets a distinct blue so the two never
// get mistaken for each other.
const chartConfig = {
  volume: { label: "Trade volume", color: "#3b82f6" },
  profit: { label: "Profit", color: "#22c55e" },
} satisfies ChartConfig;

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildYearlySeries(transactions: Transaction[], investments: Investment[]) {
  const now = new Date();
  const months: { key: string; month: string; volume: number; profit: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: MONTH_LABELS[date.getMonth()],
      volume: 0,
      profit: 0,
    });
  }
  const indexByKey = new Map(months.map((m, i) => [m.key, i]));
  const keyFor = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

  // Trade volume comes straight from investments (every trade regardless of
  // status), the same source the dashboard's own "Trade volume" stat uses,
  // rather than INVESTMENT_LOCK transactions, which are capped at 200 rows
  // per user and would silently understate a heavy trader's real volume.
  for (const inv of investments) {
    const idx = indexByKey.get(keyFor(new Date(inv.startDate)));
    if (idx != null) months[idx].volume += Number(inv.principal);
  }

  for (const tx of transactions) {
    if (tx.type !== "PROFIT_CREDIT" || tx.status !== "COMPLETED") continue;
    const idx = indexByKey.get(keyFor(new Date(tx.createdAt)));
    if (idx != null) months[idx].profit += Number(tx.usdEquivalent ?? tx.amount);
  }

  return months.map((m) => ({
    month: m.month,
    volume: Math.round(m.volume * 100) / 100,
    profit: Math.round(m.profit * 100) / 100,
  }));
}

export function YearlyActivityChart({
  transactions,
  investments,
}: {
  transactions: Transaction[];
  investments: Investment[];
}) {
  const data = buildYearlySeries(transactions, investments);
  const hasActivity = data.some((d) => d.volume > 0 || d.profit > 0);

  return (
    <Card className="border-hairline bg-surface">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Yearly activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} stroke="var(--hairline)" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
            <YAxis hide domain={[0, (dataMax: number) => (dataMax > 0 ? dataMax * 1.2 : 10)]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="volume" fill="var(--color-volume)" radius={4} />
            <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
          </BarChart>
        </ChartContainer>
        {!hasActivity ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            No trades or profit yet this year. Completed cycles will show up here.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
