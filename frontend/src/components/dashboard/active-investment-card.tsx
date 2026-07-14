"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BotStatusPill } from "@/components/dashboard/bot-activity-indicator";
import { investmentsApi, ApiError, type Investment } from "@/lib/dashboard-api";
import { bots } from "@/lib/site-config";
import { formatDateTime } from "@/lib/utils";

const statusStyles: Record<Investment["status"], string> = {
  AWAITING: "bg-status-warning/15 text-status-warning",
  ACTIVE: "bg-secondary text-foreground",
  LOCKED: "bg-secondary text-foreground",
  COMPLETED: "bg-status-good/15 text-status-good",
  CANCELLED: "bg-destructive/15 text-destructive",
};

export function ActiveInvestmentCard({
  investment,
  onChanged,
}: {
  investment: Investment;
  onChanged?: () => void;
}) {
  const [ending, setEnding] = useState(false);
  const now = new Date();
  const endDate = investment.endDate ? new Date(investment.endDate) : null;
  const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;
  const isRunning = investment.status === "ACTIVE";
  const bot = bots.find((b) => b.slug === investment.plan.slug);

  async function endTrade() {
    setEnding(true);
    try {
      await investmentsApi.end(investment.id);
      toast.success("Trade ended. Principal and profit credited to your wallet.");
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not end this trade");
    } finally {
      setEnding(false);
    }
  }

  return (
    <Card className="border-hairline bg-surface">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-medium">{investment.plan.name}</p>
          <Badge className={`border-0 ${statusStyles[investment.status]}`}>{investment.status}</Badge>
        </div>
        {isRunning ? <BotStatusPill color={bot?.color} /> : null}
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Principal</dt>
            <dd className="text-tabular font-semibold">${Number(investment.principal).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Profit accrued</dt>
            <dd className="text-tabular font-semibold text-status-good">
              +${Number(investment.profitAccrued).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Started {formatDateTime(investment.startDate)}
          {isRunning
            ? ` · ${
                daysLeft == null
                  ? "No fixed end date"
                  : daysLeft > 0
                    ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`
                    : "Completing soon"
              }`
            : investment.completedAt
              ? ` · Completed ${formatDateTime(investment.completedAt)}`
              : ""}
        </p>
        {investment.status === "ACTIVE" ? (
          <Button size="sm" variant="outline" className="w-full" onClick={endTrade} disabled={ending}>
            {ending ? "Ending…" : "End trade"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
