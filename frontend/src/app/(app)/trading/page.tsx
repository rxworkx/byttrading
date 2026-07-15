"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Layers, Plus, TrendingUp, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BotCard } from "@/components/dashboard/bot-card";
import { ActiveInvestmentCard } from "@/components/dashboard/active-investment-card";
import {
  subscriptionsApi,
  investmentsApi,
  walletsApi,
  type Subscription,
  type Investment,
  type Wallet,
} from "@/lib/dashboard-api";
import { bots } from "@/lib/site-config";

const PAGE_SIZE = 20;

type StatusFilter = "ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED";

const STATUS_LABELS: Record<StatusFilter, string> = {
  ALL: "All statuses",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function TradingContent() {
  const searchParams = useSearchParams();
  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showPlaceTrade, setShowPlaceTrade] = useState(() => searchParams.get("addTrade") === "1");

  const load = useCallback(() => {
    subscriptionsApi.mine().then(setSubscriptions);
    investmentsApi.mine().then((data) => {
      setInvestments(data);
      // Nothing running yet means there's nothing to look at below, so the
      // place-a-trade section should already be open instead of making a new
      // user hunt for the "Add trade" button.
      if (data.length === 0) {
        setShowPlaceTrade(true);
      }
    });
    walletsApi.list().then(setWallets);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Resets to page 1 whenever the filter/search changes, without a
  // dedicated effect: comparing against the previous filters during render
  // and adjusting state is the pattern React recommends over syncing state
  // via useEffect for this case.
  const [prevFilters, setPrevFilters] = useState({ statusFilter, search });
  if (prevFilters.statusFilter !== statusFilter || prevFilters.search !== search) {
    setPrevFilters({ statusFilter, search });
    setPage(1);
  }

  const activeSubscriptions = (subscriptions ?? [])
    .filter((s) => new Date(s.expiresAt) > new Date())
    .sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());

  const filteredInvestments = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matchesQuery = (inv: Investment) => {
      if (!query) return true;
      const haystack = [
        inv.plan.name,
        inv.principal,
        inv.profitAccrued,
        new Date(inv.startDate).toLocaleDateString(),
        new Date(inv.startDate).toISOString().slice(0, 10),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    };
    const isOngoing = (inv: Investment) =>
      inv.status === "ACTIVE" || inv.status === "LOCKED" || inv.status === "AWAITING";
    return [...investments]
      .filter((inv) => {
        if (statusFilter === "ALL") return true;
        if (statusFilter === "ACTIVE") return isOngoing(inv);
        return inv.status === statusFilter;
      })
      .filter(matchesQuery)
      .sort((a, b) => {
        if (isOngoing(a) !== isOngoing(b)) return isOngoing(a) ? -1 : 1;
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      });
  }, [investments, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredInvestments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredInvestments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Trading</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Place a trade with a bot you are subscribed to, then use this same page to view every cycle
            you have running or have already completed.
          </p>
        </div>
        <Button
          className="brand-gradient text-background hover:opacity-90"
          onClick={() => setShowPlaceTrade((v) => !v)}
        >
          {showPlaceTrade ? <X className="mr-1 size-4" /> : <Plus className="mr-1 size-4" />}
          Add trade
        </Button>
      </div>

      {showPlaceTrade ? (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground">Place a new trade</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {!subscriptions ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)
            ) : activeSubscriptions.length > 0 ? (
              activeSubscriptions.map((s) => {
                const bot = bots.find((b) => b.slug === s.plan.slug);
                return (
                  <BotCard
                    key={s.id}
                    plan={s.plan}
                    subscription={s}
                    image={bot?.image}
                    tagline={bot?.tagline}
                    wallets={wallets}
                    onChanged={load}
                  />
                );
              })
            ) : (
              <div className="col-span-full flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-surface p-8 text-center">
                <Layers className="size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  You are not subscribed to a bot yet. Subscribe to a plan to unlock trading with it.
                </p>
                <Button
                  size="sm"
                  nativeButton={false}
                  className="brand-gradient text-background hover:opacity-90"
                  render={
                    <Link href="/subscriptions">
                      View plans <ArrowRight className="ml-1 size-3.5" />
                    </Link>
                  }
                />
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Your trades</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search trades"
                className="h-9 w-48 pl-8 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue>{STATUS_LABELS[statusFilter]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {STATUS_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {investments.length === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-8 text-center">
            <TrendingUp className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No trades yet. Place one below to get started.</p>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-8 text-center">
            <Search className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No trades match that search or filter.</p>
          </div>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {pageItems.map((inv) => (
                <ActiveInvestmentCard key={inv.id} investment={inv} onChanged={load} />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}, {filteredInvestments.length} trade{filteredInvestments.length === 1 ? "" : "s"}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="icon-sm"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default function TradingPage() {
  return (
    <Suspense>
      <TradingContent />
    </Suspense>
  );
}
