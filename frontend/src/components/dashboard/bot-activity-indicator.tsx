"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Bot, BotOff } from "lucide-react";

const STATUS_MESSAGES = [
  "Scanning market...",
  "Executing trade...",
  "Rebalancing position...",
  "Tracking momentum...",
];

const NO_SUBSCRIPTION_MESSAGE = "No bot subscribed yet";
const NO_ACTIVE_TRADE_MESSAGE = "Bot ready, no trade running";
const FALLBACK_COLOR = "#6366f1";
const ROTATE_MS = 2800;

export interface ActiveTradeInfo {
  id: string;
  botName: string;
  color?: string;
  tradeRef: string;
}

// A single bar, not one per trade. When there's more than one active trade it
// cycles through them (and the status line) on a timer instead of stacking
// multiple indicators. When idle, it still distinguishes "no bot subscribed
// at all" from "subscribed, just no trade running right now".
export function BotActivityIndicator({
  trades,
  hasSubscription,
}: {
  trades: ActiveTradeInfo[];
  hasSubscription: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const active = trades.length > 0;

  useEffect(() => {
    if (!active) return;
    setIndex(0);
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % trades.length);
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, ROTATE_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, trades.length]);

  const current = active ? trades[index % trades.length] : null;
  const idleMessage = hasSubscription ? NO_ACTIVE_TRADE_MESSAGE : NO_SUBSCRIPTION_MESSAGE;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-1.5">
      <motion.span
        key={current?.id ?? "idle"}
        className={`flex size-6 shrink-0 items-center justify-center rounded-full ${active ? "text-background" : "bg-muted text-muted-foreground"}`}
        style={active ? { backgroundColor: current?.color ?? FALLBACK_COLOR } : undefined}
        animate={active ? { x: [0, 3, 0, -3, 0], rotate: [0, 8, 0, -8, 0] } : undefined}
        transition={active ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        {active || hasSubscription ? <Bot className="size-3.5" /> : <BotOff className="size-3.5" />}
      </motion.span>
      <div className="leading-tight">
        {active && current ? (
          <>
            <p className="text-xs font-semibold">
              {current.botName} <span className="font-normal text-muted-foreground">#{current.tradeRef}</span>
              {trades.length > 1 ? (
                <span className="ml-1 text-muted-foreground">
                  ({index + 1}/{trades.length})
                </span>
              ) : null}
            </p>
            <p className="text-[11px] text-muted-foreground">{STATUS_MESSAGES[statusIndex]}</p>
          </>
        ) : (
          <p className="text-xs font-medium text-muted-foreground">{idleMessage}</p>
        )}
      </div>
    </div>
  );
}

// A minimal, single-trade version for use inside a card that already
// represents one specific active trade (no cycling between trades needed,
// just the animated icon and rotating status line).
export function BotStatusPill({ color }: { color?: string }) {
  // Randomized per instance so cards mounted at the same time don't rotate
  // their status text or wiggle their icon in visible lockstep.
  const [statusIndex, setStatusIndex] = useState(() => Math.floor(Math.random() * STATUS_MESSAGES.length));
  const [intervalMs] = useState(() => ROTATE_MS + Math.round((Math.random() - 0.5) * 1200));
  const [delay] = useState(() => Math.random() * 2.2);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-2.5 py-1.5">
      <motion.span
        className="flex size-5 shrink-0 items-center justify-center rounded-full text-background"
        style={{ backgroundColor: color ?? FALLBACK_COLOR }}
        animate={{ x: [0, 3, 0, -3, 0], rotate: [0, 8, 0, -8, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <Bot className="size-3" />
      </motion.span>
      <p className="text-xs text-muted-foreground">{STATUS_MESSAGES[statusIndex]}</p>
    </div>
  );
}
