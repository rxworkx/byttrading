"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = ["General", "Security"] as const;
type Category = (typeof categories)[number];

const faqs: { question: string; answer: string; category: Category }[] = [
  {
    question: "How does a trading cycle work?",
    answer:
      "When you start a trade, your chosen principal amount moves from the wallet you pick into a locked state tied to that bot's cycle length. Profit accrues within the bot's target rate range over the cycle. When the cycle ends, principal and profit release back to that same wallet automatically.",
    category: "General",
  },
  {
    question: "Can I withdraw funds while a trade is running?",
    answer:
      "No, principal and any accrued profit are locked for the duration of the cycle. Funds in your other wallets, or in the same wallet outside an active trade, remain available to withdraw.",
    category: "General",
  },
  {
    question: "Which cryptocurrencies can I deposit?",
    answer:
      "Your wallet supports major assets including BTC, ETH, USDT, USDC, BNB, SOL, XRP, and DOGE, plus a USD denominated balance. Live prices are sourced from CoinGecko.",
    category: "General",
  },
  {
    question: "What is the difference between the three bots?",
    answer:
      "AetherGuard targets steady, lower variance returns over a 7 day cycle. QuantumPulse balances risk and reward over 14 days. TitanForge targets the highest returns over a 21 day cycle for traders comfortable with more volatility.",
    category: "General",
  },
  {
    question: "I do not have crypto yet, can I still get started?",
    answer:
      "Yes. From the Fund Account page you can buy crypto through a trusted on ramp partner using a card or bank transfer, then deposit it straight into your wallet.",
    category: "General",
  },
  {
    question: "Should I pick the 6 month or 1 year term?",
    answer:
      "The 1 year term costs less per month of access and suits traders who already know they want to keep trading with a bot long term. The 6 month term costs a little more overall but is a lower commitment while you are still deciding if a bot's style suits you.",
    category: "General",
  },
  {
    question: "Does the subscription fee come out of my trading capital?",
    answer:
      "No. The subscription fee is a separate one time charge that unlocks the bot. It is never deducted from the principal you place in a trade.",
    category: "General",
  },
  {
    question: "What happens when my term expires?",
    answer:
      "You keep any completed profit and your principal in full. You will need to renew the subscription to place new trades with that bot again, but nothing is forfeited when a term ends.",
    category: "General",
  },
  {
    question: "Do I need to verify my email or turn on two factor login?",
    answer:
      "No. Both are optional account enhancements you can enable from your security settings whenever you want extra protection. Your account works fully without them from day one.",
    category: "Security",
  },
  {
    question: "Are withdrawals reviewed manually?",
    answer:
      "Yes, by default all withdrawal requests are reviewed by our team before funds release, as an additional layer of account protection.",
    category: "Security",
  },
];

export function Faq() {
  const [category, setCategory] = useState<Category>("General");
  const [openIndex, setOpenIndex] = useState(0);

  const filtered = faqs.filter((faq) => faq.category === category);

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="order-2 lg:order-1 lg:col-span-7">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Questions</p>
            <div className="inline-flex gap-1 rounded-full border border-hairline bg-surface/60 p-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setOpenIndex(0);
                  }}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    category === cat
                      ? "brand-gradient text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-hairline">
            {filtered.map((faq, index) => {
              const expanded = index === openIndex;

              return (
                <div key={faq.question} className="border-b border-hairline">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(expanded ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="text-tabular text-sm font-semibold text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-lg font-semibold">{faq.question}</span>
                    </span>
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                        expanded ? "border-primary/30 bg-primary/10 text-primary" : "border-hairline",
                      )}
                    >
                      {expanded ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
                    </span>
                  </button>
                  {expanded ? (
                    <p className="pb-6 pl-11 text-base text-muted-foreground">{faq.answer}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="order-1 flex flex-col lg:order-2 lg:col-span-5 lg:h-full lg:items-center lg:justify-center lg:text-center">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">FAQS</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Frequently Asked Questions</h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground lg:leading-loose">
            Everything you need to know about cycles, deposits, pricing, and account security, organized
            by topic so you can find your answer fast.
          </p>
        </div>
      </div>
    </section>
  );
}
