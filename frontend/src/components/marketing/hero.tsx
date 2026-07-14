"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Bot, Home, Receipt, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Active Trading Bots", value: "3" },
  { label: "Cycle Length Range", value: "7 to 21 days" },
  { label: "Company Registration", value: "ABN Verified" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* CSS/SVG background: dark gradient + circuit/candlestick motif */}
      <div className="absolute inset-0 -z-10 bg-background">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(60% 50% at 15% 10%, rgba(20,184,166,0.25), transparent 60%), radial-gradient(50% 40% at 90% 20%, rgba(16,185,129,0.18), transparent 60%)",
          }}
        />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.15]"
          aria-hidden
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#14b8a6" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <CandlestickMotif />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pt-16 pb-24 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-10 lg:pb-24">
        <div className="lg:mt-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            Automated, bot driven trade cycles
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Put your capital to work with bots that trade{" "}
            <span className="brand-gradient-text">while you sleep</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            Automated trading bots running fixed cycle strategies in financial markets, with
            published rate ranges. Proven payouts released the moment each cycle completes.
          </p>
          <div className="mt-8 flex flex-nowrap gap-2 sm:gap-4">
            <Button
              size="sm"
              nativeButton={false}
              className="h-10 px-4 text-sm sm:h-11 sm:px-5 sm:text-base lg:h-14 lg:px-7 lg:text-lg brand-gradient text-background hover:opacity-90"
              render={
                <Link href="/signup">
                  Get started <ArrowRight className="ml-1 size-4" />
                </Link>
              }
            />
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              className="h-10 px-4 text-sm sm:h-11 sm:px-5 sm:text-base lg:h-14 lg:px-7 lg:text-lg"
              render={<Link href="/plans">View trading bots</Link>}
            />
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-2 border-t border-hairline pt-8 sm:gap-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-[10px] text-muted-foreground sm:text-xs">{stat.label}</dt>
                <dd className="mt-1 text-sm font-semibold sm:text-xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-4 lg:mt-0">
          <TradeExecutionVisual />
        </div>
      </div>
    </section>
  );
}

function CandlestickMotif() {
  const bars = [40, 65, 30, 80, 55, 90, 45, 70, 35, 60, 85, 50];
  return (
    <svg
      className="absolute bottom-0 left-0 h-1/3 w-full opacity-[0.12]"
      viewBox="0 0 600 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 50 + 10}
          y={100 - h}
          width="18"
          height={h}
          fill={i % 3 === 0 ? "#ef4444" : "#14b8a6"}
        />
      ))}
    </svg>
  );
}

type TradePhase = "placing" | "tapped" | "executing" | "dashboard";

function TradeExecutionVisual() {
  const [phase, setPhase] = useState<TradePhase>("placing");

  useEffect(() => {
    const durations: Record<TradePhase, number> = {
      placing: 1800,
      tapped: 500,
      executing: 2600,
      dashboard: 2400,
    };
    const next: Record<TradePhase, TradePhase> = {
      placing: "tapped",
      tapped: "executing",
      executing: "dashboard",
      dashboard: "placing",
    };
    const timer = setTimeout(() => setPhase((p) => next[p]), durations[phase]);
    return () => clearTimeout(timer);
  }, [phase]);

  const executing = phase === "executing";

  return (
    <div className="relative mx-auto h-[38rem] w-full max-w-[21rem]">
      <motion.div
        className="absolute inset-0 rounded-3xl brand-gradient opacity-20 blur-2xl"
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Bot execution badge, active while the bot is working the trade. Sits
          outside the scene's overflow-hidden box on purpose, so it can spill
          past the background's edge instead of being clipped by it. */}
      <div className="absolute top-12 right-12 z-10">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-primary"
          animate={{
            scale: executing ? [1, 1.9] : [1, 1.4],
            opacity: executing ? [0.8, 0] : [0.4, 0],
          }}
          transition={{ duration: executing ? 1.1 : 1.8, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="relative flex size-14 items-center justify-center rounded-full brand-gradient text-background shadow-lg"
          animate={executing ? { rotate: 360 } : { rotate: 0 }}
          transition={executing ? { duration: 1.6, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
        >
          <Bot className="size-7" />
        </motion.span>
      </div>
      <div className="relative flex h-full w-full items-center justify-center">
        {/* Signal traveling from the phone to the bot badge once the trade is confirmed */}
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          <line x1="50%" y1="42%" x2="80%" y2="18%" stroke="#14b8a6" strokeOpacity="0.35" strokeDasharray="4 6" />
        </svg>
        {phase !== "placing" ? (
          <motion.span
            key={phase}
            className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            initial={{ left: "50%", top: "42%", opacity: 0 }}
            animate={{ left: "80%", top: "18%", opacity: [0, 1, 0] }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        ) : null}

        {/* Phone mockup, sized to fill almost all of its container instead of
            floating small in a lot of empty space */}
        <div className="relative flex h-[34rem] w-[318px] flex-col rounded-[3rem] border-4 border-background bg-background/95 p-3 shadow-2xl">
          <div className="relative flex-1 overflow-hidden rounded-[2.25rem] bg-surface p-[14px] px-[18px] pt-[42px]">
            <div className="absolute top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-background" />
            <AnimatePresence mode="wait">
              {phase === "executing" ? (
                <motion.div
                  key="executing"
                  className="flex h-full flex-col items-center justify-center text-center"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.span
                    className="flex size-16 items-center justify-center rounded-full bg-primary/20 text-primary"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                  >
                    <Bot className="size-8" />
                  </motion.span>
                  <p className="mt-5 text-lg font-semibold">Executing trade</p>
                  <p className="mt-1 text-sm text-muted-foreground">QuantumPulse is placing your order</p>
                  <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-background/60">
                    <motion.div
                      className="h-full rounded-full brand-gradient"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.2, ease: "easeInOut" }}
                    />
                  </div>
                </motion.div>
              ) : phase === "dashboard" ? (
                <motion.div
                  key="dashboard"
                  className="flex h-full flex-col"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-[9px] font-semibold">Welcome back, John</p>
                  <p className="text-[6px] text-muted-foreground">Here is where your balances, trades, and account stand</p>

                  {/* Mirrors the real dashboard's stat cards, one per row on
                      mobile (grid-cols-1), each with its own full-width cta */}
                  <div className="mt-2 rounded-sm brand-gradient p-2 text-background">
                    <p className="text-[7px] opacity-80">Balance</p>
                    <p className="text-tabular text-sm font-semibold">$135,386.39</p>
                    <div className="mt-1 flex justify-between border-t border-background/20 pt-1 text-[6px]">
                      <div>
                        <p className="opacity-70">Total in</p>
                        <p className="font-semibold">$158,900.00</p>
                      </div>
                      <div className="text-right">
                        <p className="opacity-70">Total out</p>
                        <p className="font-semibold">$23,513.61</p>
                      </div>
                    </div>
                    <div className="mt-1 rounded-md bg-background/15 py-1 text-center text-[7px] font-semibold">
                      Fund account
                    </div>
                  </div>

                  <div className="mt-3 rounded-sm border border-hairline bg-background/60 p-2">
                    <p className="text-[7px] text-muted-foreground">Trade volume</p>
                    <p className="text-tabular text-sm font-semibold">$96,400</p>
                    <div className="mt-1 flex justify-between border-t border-hairline pt-1 text-[6px] text-muted-foreground">
                      <div>
                        <p>Total profit</p>
                        <p className="font-semibold text-foreground">$9,842.60</p>
                      </div>
                      <div className="text-right">
                        <p>Trades placed</p>
                        <p className="font-semibold text-foreground">27</p>
                      </div>
                    </div>
                    <div className="relative mt-1">
                      <div className="rounded-md border border-hairline py-1 text-center text-[7px] font-semibold text-primary">
                        Place a trade
                      </div>
                      <motion.span
                        className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/70"
                        animate={{ scale: [0.5, 1.6], opacity: [0.6, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                      />
                      <motion.span
                        className="absolute -bottom-3 left-1/3 text-sm leading-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)] select-none"
                        animate={{ y: [2, -1, 2], rotate: 10 }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                        aria-hidden
                      >
                        👆
                      </motion.span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-sm border border-hairline bg-background/60 p-2">
                    <p className="text-[7px] text-muted-foreground">Active trades</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <p className="text-tabular text-sm font-semibold">6</p>
                      <span className="flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[5.5px] text-primary">
                        <motion.span
                          className="size-1 rounded-full bg-primary"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                        />
                        QuantumPulse live
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between border-t border-hairline pt-1 text-[6px] text-muted-foreground">
                      <div>
                        <p>Active profit</p>
                        <p className="font-semibold text-foreground">$412.90</p>
                      </div>
                      <div className="text-right">
                        <p>Principal locked</p>
                        <p className="font-semibold text-foreground">$28,650</p>
                      </div>
                    </div>
                    <div className="mt-1 rounded-md border border-hairline py-1 text-center text-[7px] font-semibold text-primary">
                      Manage trades
                    </div>
                  </div>

                  {/* Mini yearly bars, mirrors the real dashboard's yearly
                      activity chart (trade volume + profit, one color each) */}
                  <div className="mt-3 rounded-sm border border-hairline bg-background/60 p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[7px] text-muted-foreground">Yearly activity</p>
                      <div className="flex items-center gap-1.5 text-[5.5px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <span className="size-1 rounded-full bg-[#3b82f6]" /> Volume
                        </span>
                        <span className="flex items-center gap-0.5">
                          <span className="size-1 rounded-full bg-status-good" /> Profit
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 flex h-7 items-end gap-1">
                      {[
                        [40, 12], [55, 18], [48, 15], [65, 22], [58, 20], [72, 28],
                        [60, 24], [80, 32], [70, 30], [90, 38], [85, 36], [100, 44],
                      ].map(([vol, profit], i) => (
                        <span key={i} className="flex h-full flex-1 items-end gap-px">
                          <span className="w-1/2 bg-[#3b82f6]/60" style={{ height: `${vol}%` }} />
                          <span className="w-1/2 bg-status-good/60" style={{ height: `${profit}%` }} />
                        </span>
                      ))}
                    </div>
                    <div className="mt-0.5 flex justify-between text-[4.5px] text-muted-foreground">
                      {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m) => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  </div>

                  {/* Mobile bottom tab bar, mirrors the real app's mobileQuickNav */}
                  <div className="-mx-[18px] -mb-[14px] mt-auto grid grid-cols-4 gap-1 border-t border-hairline bg-background/80 px-2 pt-1 pb-1.5">
                    <div className="flex flex-col items-center gap-0.5 text-primary">
                      <Home className="size-2.5" />
                      <span className="text-[5px] font-medium">Home</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
                      <Wallet className="size-2.5" />
                      <span className="text-[5px]">Wallet</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
                      <TrendingUp className="size-2.5" />
                      <span className="text-[5px]">Trading</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
                      <Receipt className="size-2.5" />
                      <span className="text-[5px]">Transactions</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm text-muted-foreground">Place a trade</p>

                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-hairline bg-background/60 px-4 py-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <Bot className="size-5" />
                    </span>
                    <span className="text-base font-medium">QuantumPulse</span>
                  </div>

                  <div className="mt-4 rounded-xl border border-hairline bg-background/60 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-tabular text-2xl font-semibold">$500.00</p>
                  </div>

                  <div className="relative mt-6">
                    <motion.div
                      className="w-full rounded-xl brand-gradient py-3.5 text-center text-base font-semibold text-background"
                      animate={phase === "tapped" ? { scale: 0.94 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      Confirm trade
                    </motion.div>
                    <motion.span
                      className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70"
                      animate={{ scale: [0.5, 1.6], opacity: [0.6, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                    />
                    <motion.span
                      className="absolute -bottom-14 left-0 text-6xl leading-none drop-shadow-[0_4px_5px_rgba(0,0,0,0.45)] select-none"
                      animate={
                        phase === "tapped"
                          ? { y: -22, scale: 0.92, rotate: 4 }
                          : { y: [6, -1, 6], scale: 1, rotate: 14 }
                      }
                      transition={
                        phase === "tapped"
                          ? { duration: 0.2 }
                          : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                      }
                      aria-hidden
                    >
                      👆
                    </motion.span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Live ticking readout, matches the phone's own width (the phone
            sits centered with an 8px margin on each side of this container).
            Hidden on the dashboard phase, whose in-phone bottom nav already
            occupies that same space. */}
        {phase !== "dashboard" ? (
          <div className="absolute bottom-5 left-2 right-2 rounded-xl border border-hairline bg-background/70 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>QuantumPulse · {executing ? "executing" : "ready"}</span>
              <span className="flex items-center gap-1.5">
                <motion.span
                  className="size-1.5 rounded-full bg-status-good"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                live
              </span>
            </div>
            <div className="mt-1 text-tabular text-base font-semibold text-status-good">+1.14% today</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
