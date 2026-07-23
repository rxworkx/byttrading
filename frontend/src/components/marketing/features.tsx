import Link from "next/link";
import { ArrowDownToLine, ArrowRight, ShieldCheck, Repeat, Scale, Activity, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const candles = [
  { h: 70, up: true },
  { h: 110, up: true },
  { h: 60, up: false },
  { h: 140, up: true },
  { h: 90, up: true },
  { h: 160, up: false },
  { h: 80, up: true },
  { h: 120, up: true },
  { h: 55, up: false },
  { h: 130, up: true },
  { h: 100, up: true },
  { h: 150, up: false },
  { h: 75, up: true },
  { h: 115, up: true },
  { h: 65, up: false },
  { h: 145, up: true },
] as const;

function ChartBackdrop() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="features-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="features-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="0" y1={i * 100 + 50} x2="800" y2={i * 100 + 50} stroke="#14b8a6" strokeOpacity="0.08" />
      ))}

      {candles.map((c, i) => {
        const x = i * 48 + 24;
        const bodyBottom = 440;
        const bodyTop = bodyBottom - c.h;
        const color = c.up ? "#14b8a6" : "#f43f5e";
        return (
          <g key={i}>
            <line x1={x + 5} y1={bodyTop - 20} x2={x + 5} y2={bodyBottom + 20} stroke={color} strokeOpacity="0.3" />
            <rect x={x} y={bodyTop} width="10" height={c.h} fill={color} opacity="0.35" />
          </g>
        );
      })}

      <path
        d="M 0 320 C 100 260, 150 300, 220 250 C 300 200, 350 260, 420 220 C 500 180, 550 230, 620 190 C 700 150, 750 200, 800 160 L 800 460 L 0 460 Z"
        fill="url(#features-area)"
      />
      <path
        d="M 0 320 C 100 260, 150 300, 220 250 C 300 200, 350 260, 420 220 C 500 180, 550 230, 620 190 C 700 150, 750 200, 800 160"
        fill="none"
        stroke="url(#features-line)"
        strokeWidth="3"
      />
    </svg>
  );
}

const cycleStats = [
  { label: "Strategy clarity", value: "9.68/10" },
  { label: "Execution accuracy", value: "9.87/10" },
] as const;

const items = [
  {
    icon: Repeat,
    title: "Consistent execution",
    description:
      "The same strategy logic runs every single cycle, for every subscriber, with no manual overrides mid cycle. Consistency is enforced by the system, not left to discretion.",
    span: "lg:col-span-7",
    featured: true,
  },
  {
    icon: Scale,
    title: "Risk tiered options",
    description:
      "AetherGuard, QuantumPulse, and TitanForge sit at different points on the risk spectrum, from steady and capital preserving to aggressive and high conviction.",
    span: "lg:col-span-5",
    featured: false,
  },
  {
    icon: ShieldCheck,
    title: "Reviewed fund movements",
    description:
      "Deposits and withdrawals pass through admin review before funds move, a real check against mistakes rather than an instant transfer with no one watching.",
    span: "lg:col-span-4",
    featured: false,
  },
  {
    icon: Activity,
    title: "Live market pricing",
    description:
      "Wallet balances are priced against live rates pulled from CoinGecko on a continuous refresh cycle, with a resilient cache behind them so pricing never goes stale.",
    span: "lg:col-span-4",
    featured: false,
  },
  {
    icon: Wallet,
    title: "Multi asset wallets",
    description:
      "Every crypto asset you hold gets its own dedicated wallet, and every cycle you run draws straight from whichever one you pick.",
    span: "lg:col-span-4",
    featured: false,
  },
] as const;

export function Features() {
  return (
    <section className="section-light section-light-hairline border-t">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Features</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Trade performance built for transparency
            </h2>
            <p className="mt-6 max-w-md text-lg section-light-muted">
              Track execution quality, realized returns, and strategy accuracy in real time. Clear performance
              signals and historical metrics help you evaluate every trade with confidence.
            </p>
            <Link
              href="/technology"
              className="mt-6 inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline"
            >
              Learn more <ArrowRight className="size-4" />
            </Link>

            <div className="mt-10 flex max-w-xs items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_4px_10px_rgba(11,21,18,0.06),0_16px_32px_rgba(11,21,18,0.1)]">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ArrowDownToLine className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Realtime performance signal</p>
                <p className="text-tabular text-3xl font-bold text-status-good">95000 TPS</p>
              </div>
            </div>
          </div>

          <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-3xl bg-background p-8 sm:p-12">
            <ChartBackdrop />

            <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(11,21,18,0.04),0_10px_24px_rgba(11,21,18,0.08)]">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Trade performance details</p>
                  <p className="text-xs section-light-muted">Validated execution and returns</p>
                </div>
              </div>

              <p className="mt-6 text-xs section-light-muted">Performance visibility</p>
              <p className="text-tabular mt-1 text-3xl font-bold">
                Live cycle metrics
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {cycleStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-[#f3f4f2] p-3">
                    <p className="text-xs section-light-muted">{stat.label}</p>
                    <p className="text-tabular mt-1 text-sm font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12">
          {items.map((item) => (
            <div
              key={item.title}
              className={cn(
                "group rounded-3xl border p-8 transition-all hover:-translate-y-0.5 hover:shadow-lg",
                item.span,
                item.featured
                  ? "bg-background border-transparent text-white"
                  : "section-light-card section-light-hairline",
              )}
            >
              <item.icon className={cn(item.featured ? "size-8" : "size-7", "text-primary")} />
              <h3 className={cn("mt-4 font-semibold", item.featured ? "text-2xl" : "text-lg")}>{item.title}</h3>
              <p
                className={cn(
                  "mt-2",
                  item.featured ? "max-w-md text-base font-medium text-white/90" : "text-base section-light-muted",
                )}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
