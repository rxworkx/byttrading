"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Bell, Bot, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "3", label: "Active Trading Bots" },
  { value: "<50ms", label: "Prediction Latency" },
  { value: "20+", label: "Trades Per Day" },
];

export function Hero() {
  return (
    <section className="relative -mt-[86px] overflow-hidden border-b border-hairline">
      <div className="absolute inset-0 -z-10 bg-background">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(50% 40% at 30% 22%, rgba(45,212,191,0.22), transparent 60%), radial-gradient(45% 35% at 92% 15%, rgba(56,189,248,0.16), transparent 60%)",
          }}
        />
        <svg className="absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#2dd4bf" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pt-[150px] pb-24 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-[126px] lg:pb-24">
        <div className="lg:mt-10">
          <div className="inline-flex h-9 items-center gap-2 rounded-full border border-hairline bg-surface px-4 text-xs text-muted-foreground sm:h-10 sm:text-sm">
            <Sparkles className="size-4 text-white" />
            Automated, bot driven trade cycles
          </div>
          <h1 className="mt-6 text-[40px] leading-[1.2] font-bold tracking-tight sm:text-[44px] lg:text-[56px]">
            Deep Quantitative
            <br />
            <span className="brand-gradient-text">Algorithmic Trading</span>
            <br />
            Bot Network
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Automated trading bots running fixed cycle strategies in financial markets, with
            published rate ranges. A demonstrated track record of performance, visible the moment each
            cycle completes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-nowrap">
            <Button
              nativeButton={false}
              className="h-14 w-full gap-1.5 rounded-xl px-4 text-base font-semibold sm:h-11 sm:w-auto sm:px-5 sm:text-base lg:h-12 lg:px-6 brand-gradient text-primary-foreground hover:opacity-90"
              render={
                <Link href="/signup">
                  Get started <ArrowRight className="size-4" />
                </Link>
              }
            />
            <Button
              variant="outline"
              nativeButton={false}
              className="h-14 w-full gap-1.5 rounded-xl px-4 text-base font-semibold sm:h-11 sm:w-auto sm:px-5 sm:text-base lg:h-12 lg:px-6"
              render={
                <Link href="/plans">
                  <TrendingUp className="size-4" /> View trading bots
                </Link>
              }
            />
          </div>

          <dl className="mt-12 flex flex-nowrap justify-between gap-y-6 border-t border-hairline pt-8">
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-[5.5rem] text-center">
                <dd className="text-lg font-extrabold text-white sm:text-2xl lg:text-3xl">{stat.value}</dd>
                <dt className="mt-1 text-nowrap text-[10px] tracking-tight text-muted-foreground sm:text-sm sm:tracking-normal">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-4 lg:mt-0">
          <TradeDashboardMockup />
        </div>
      </div>
    </section>
  );
}

// Phone screen "camera notch", the same small pill cutout on both the
// background and foreground phones so they read as actual devices rather
// than plain rounded cards.
function Notch() {
  return (
    <div className="absolute top-2 left-1/2 z-10 h-2 w-16 -translate-x-1/2 rounded-full bg-background/80" />
  );
}

type TradePhase = "home" | "chooseBot" | "selectAmount" | "executing";

const tradeBots = [
  { name: "AetherGuard", rate: "0.25% to 0.6%", selected: false },
  { name: "QuantumPulse", rate: "0.8% to 1.8%", selected: true },
  { name: "TitanForge", rate: "2.0% to 4.5%", selected: false },
];

// Two badges anchor to the background "Transparency" phone (top center,
// left mid), two anchor to the foreground "Home" phone (top right, bottom
// right) - each bobs slowly and independently via its own duration/delay.
const forexBadges = [
  {
    pair: "USD/JPY",
    flag: "🇺🇸",
    showFlag: true,
    showTrend: false,
    position: "-top-5 left-1/2 -translate-x-1/2",
    duration: 3.2,
    delay: 0,
  },
  {
    pair: "EUR/USD",
    flag: "🇪🇺",
    showFlag: true,
    showTrend: false,
    position: "top-1/2 -left-4 -translate-y-1/2",
    duration: 2.8,
    delay: 0.4,
  },
  {
    pair: "GBP/JPY",
    flag: "🇬🇧",
    showFlag: false,
    showTrend: true,
    position: "top-6 right-6",
    duration: 3,
    delay: 0.8,
  },
  {
    pair: "XAU/USD",
    flag: "🥇",
    showFlag: false,
    showTrend: true,
    position: "-right-3 -bottom-3",
    duration: 2.6,
    delay: 0.2,
  },
] as const;

function TradeDashboardMockup() {
  const [phase, setPhase] = useState<TradePhase>("home");

  useEffect(() => {
    const durations: Record<TradePhase, number> = {
      home: 3000,
      chooseBot: 1900,
      selectAmount: 1900,
      executing: 2400,
    };
    const next: Record<TradePhase, TradePhase> = {
      home: "chooseBot",
      chooseBot: "selectAmount",
      selectAmount: "executing",
      executing: "home",
    };
    const timer = setTimeout(() => setPhase((p) => next[p]), durations[phase]);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div className="relative mx-auto h-[34rem] w-full max-w-[26rem]">
      <div className="absolute inset-0 rounded-3xl brand-gradient opacity-20 blur-2xl" />

      {/* Background panel: portfolio/transparency overview, offset up-left
          and partially covered by the foreground phone in front of it. */}
      <div className="absolute top-0 left-0 h-[29rem] w-[15.5rem] overflow-hidden rounded-3xl border border-hairline bg-card p-4 pt-8 shadow-2xl">
        <Notch />
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft className="size-4 text-muted-foreground" />
          Transparency
        </div>

        <div className="mt-4 space-y-2.5">
          {[
            { label: "Profits This Week", value: "2.34%", delta: "+0.45%" },
            { label: "Average Weekly Profit", value: "2.87%" },
            { label: "Performance Overview", value: "3.02%" },
          ].map((row) => (
            <div key={row.label} className="rounded-xl border border-hairline bg-background/60 p-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">{row.label}</p>
                {row.delta ? (
                  <span className="rounded-full bg-status-good/15 px-1.5 py-0.5 text-[9px] font-medium text-status-good">
                    {row.delta}
                  </span>
                ) : null}
              </div>
              <p className="text-tabular text-sm font-semibold">{row.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-1 rounded-full border border-hairline bg-background/60 p-1 text-[9px]">
          <span className="rounded-full bg-primary/30 px-2 py-1 font-semibold text-primary">Week</span>
          <span className="px-2 py-1 text-muted-foreground">Month</span>
          <span className="px-2 py-1 text-muted-foreground">3M</span>
        </div>

        <div className="mt-3 mb-4 flex h-28 items-end gap-1">
          {[30, 45, 38, 55, 48, 62, 50, 70].map((h, i) => (
            <span key={i} className="w-full rounded-t-sm bg-primary/30" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* Foreground panel: account home, offset down-right over the
          background panel. Its whole body (below the notch) swaps between
          four screens: Home -> Choose a bot -> Select amount -> Trade list
          (executing), then loops back to Home. */}
      <div className="absolute right-0 bottom-0 flex h-[30rem] w-[15.5rem] flex-col overflow-hidden rounded-3xl border-4 border-background bg-card shadow-2xl">
        <Notch />
        <AnimatePresence initial={false}>
          {phase === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex flex-col p-4 pt-6"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-full brand-gradient text-xs font-semibold text-background">
                  JD
                </span>
                <p className="text-sm font-semibold">Home</p>
                <Bell className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-xs font-semibold">Welcome back, John</p>
              <p className="text-[10px] text-muted-foreground">Here is your portfolio overview</p>

              <div className="mt-3 rounded-2xl brand-gradient p-3 text-background">
                <p className="text-[10px] opacity-80">Balance</p>
                <p className="text-tabular text-lg font-bold">$135,386.39</p>
                <div className="mt-2 rounded-full bg-background/15 py-1.5 text-center text-[10px] font-semibold">
                  Add funds
                </div>
              </div>

              <div className="relative mt-3 rounded-2xl border border-hairline bg-background/60 p-3">
                <p className="text-[10px] text-muted-foreground">Trade Volume</p>
                <p className="text-tabular text-base font-bold">$96,400</p>
                <div className="relative mt-2">
                  <div className="rounded-full border border-hairline py-1.5 text-center text-[10px] font-semibold text-primary">
                    Place trade
                  </div>
                  <motion.span
                    className="absolute inset-0 rounded-full border border-primary/60"
                    animate={{ scale: [1, 1.15], opacity: [0.6, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-hairline bg-background/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">Current Week Profit</p>
                  <span className="rounded-full bg-status-good/15 px-1.5 py-0.5 text-[9px] font-medium text-status-good">
                    +1.91%
                  </span>
                </div>
                <p className="text-tabular text-base font-bold">$9,842.60</p>
                <div className="mt-2 flex h-8 items-end gap-1">
                  {[40, 60, 50, 75, 65].map((h, i) => (
                    <span key={i} className="w-full rounded-t-sm bg-primary/30" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2 rounded-2xl border border-hairline bg-background/60 p-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Bot className="size-3.5" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold">Refer and earn, instantly</p>
                  <p className="text-[9px] text-muted-foreground">Rewards added to your balance</p>
                </div>
              </div>
            </motion.div>
          ) : phase === "chooseBot" ? (
            <motion.div
              key="chooseBot"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex flex-col p-4 pt-6"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ArrowLeft className="size-4 text-muted-foreground" />
                Choose a bot
              </div>
              <div className="mt-4 space-y-2">
                {tradeBots.map((bot) => (
                  <div
                    key={bot.name}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 ${
                      bot.selected ? "border-primary bg-primary/10" : "border-hairline bg-background/60"
                    }`}
                  >
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                        bot.selected ? "bg-primary/20 text-primary" : "bg-background text-muted-foreground"
                      }`}
                    >
                      <Bot className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold">{bot.name}</p>
                      <p className="text-[9px] text-muted-foreground">{bot.rate} daily</p>
                    </div>
                    {bot.selected ? <span className="size-2 shrink-0 rounded-full bg-primary" /> : null}
                  </div>
                ))}
              </div>
              <div className="mt-auto rounded-full brand-gradient py-2 text-center text-[10px] font-semibold text-background">
                Continue
              </div>
            </motion.div>
          ) : phase === "selectAmount" ? (
            <motion.div
              key="selectAmount"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex flex-col p-4 pt-6"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ArrowLeft className="size-4 text-muted-foreground" />
                Select amount
              </div>
              <p className="mt-4 text-[10px] text-muted-foreground">Trading with QuantumPulse</p>
              <p className="text-tabular mt-1 text-2xl font-bold">$500.00</p>
              <div className="mt-4 grid grid-cols-4 gap-1.5">
                {["100", "500", "1000", "Max"].map((amt) => (
                  <div
                    key={amt}
                    className={`rounded-lg border py-1.5 text-center text-[9px] font-semibold ${
                      amt === "500"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-hairline bg-background/60 text-muted-foreground"
                    }`}
                  >
                    {amt === "500" ? "$500" : amt === "Max" ? "Max" : `$${amt}`}
                  </div>
                ))}
              </div>
              <div className="mt-auto rounded-full brand-gradient py-2 text-center text-[10px] font-semibold text-background">
                Confirm
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="executing"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex flex-col p-4 pt-6"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ArrowLeft className="size-4 text-muted-foreground" />
                Trading
              </div>

              <div className="mt-4 rounded-xl border border-primary/50 bg-primary/10 p-2.5">
                <div className="flex items-center gap-2">
                  <motion.span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  >
                    <Bot className="size-3.5" />
                  </motion.span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold">QuantumPulse</p>
                    <p className="text-[9px] text-muted-foreground">$500.00 trade</p>
                  </div>
                  <motion.span
                    className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[8px] font-semibold text-primary"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    Executing
                  </motion.span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background/60">
                  <motion.div
                    className="h-full rounded-full brand-gradient"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.1, ease: "easeInOut" }}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2 rounded-xl border border-hairline bg-background/60 p-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-status-good/15 text-status-good">
                  <Bot className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold">AetherGuard</p>
                  <p className="text-[9px] text-muted-foreground">$250.00 trade</p>
                </div>
                <span className="rounded-full bg-status-good/15 px-1.5 py-0.5 text-[8px] font-semibold text-status-good">
                  +1.4%
                </span>
              </div>

              <div className="mt-auto flex items-center gap-2 rounded-2xl border border-hairline bg-background/60 p-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Bot className="size-3.5" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold">Refer and earn, instantly</p>
                  <p className="text-[9px] text-muted-foreground">Rewards added to your balance</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating forex instrument badges: two anchored to the background
          "Transparency" phone (top center, left mid) and two to the
          foreground "Home" phone (top right, bottom right), each bobbing
          slowly and independently so they read as live, not static. */}
      {forexBadges.map((badge) => (
        <motion.span
          key={badge.pair}
          className={`absolute flex items-center gap-1 rounded-full border border-hairline bg-card px-2.5 py-1.5 shadow-xl ${badge.position}`}
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: badge.duration, repeat: Infinity, ease: "easeInOut", delay: badge.delay }}
        >
          {badge.showFlag ? <span className="text-xs leading-none">{badge.flag}</span> : null}
          {badge.showTrend ? <TrendingUp className="size-3 text-status-good" /> : null}
          <span className="text-[10px] font-semibold">{badge.pair}</span>
        </motion.span>
      ))}
    </div>
  );
}
