"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { WalletSelect } from "@/components/dashboard/wallet-select";
import { CurrencyAmountField } from "@/components/dashboard/currency-amount-field";
import {
  subscriptionsApi,
  investmentsApi,
  ApiError,
  type InvestmentPlan,
  type Subscription,
  type Wallet,
} from "@/lib/dashboard-api";
import { currencyLabel, sortWalletsByBalance } from "@/lib/asset-labels";
import { formatRateFrequency, cn } from "@/lib/utils";

function showFundableError(error: unknown, fallback: string, router: ReturnType<typeof useRouter>) {
  const message = error instanceof ApiError ? error.message : fallback;
  const isInsufficientBalance = /insufficient .*balance/i.test(message);
  toast.error(message, isInsufficientBalance ? { action: { label: "Fund wallet", onClick: () => router.push("/fund-account") } } : undefined);
}

// Falls back to a generic bot portrait for any plan that has no specific
// image of its own (e.g. one created from the admin panel without a
// matching entry in the static bots catalog), so a card is never imageless.
const DEFAULT_PLAN_IMAGE = "/images/bots/three-bots.jpg";

export function BotCard({
  plan,
  subscription,
  image = DEFAULT_PLAN_IMAGE,
  tagline,
  wallets,
  onChanged,
}: {
  plan: InvestmentPlan;
  subscription?: Subscription;
  image?: string;
  tagline?: string;
  wallets?: Wallet[];
  onChanged: () => void;
}) {
  const router = useRouter();
  const [term, setTerm] = useState<"SIX_MONTHS" | "ONE_YEAR">("SIX_MONTHS");
  // principal is the USD amount actually submitted to the backend
  // (InvestmentsService.start debits by USD value); tokenAmount is just a
  // convenience mirror of it in the selected wallet's native currency.
  const [principal, setPrincipal] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const payWallets = sortWalletsByBalance(wallets ?? []);
  const [payWalletSymbol, setPayWalletSymbol] = useState("");
  const effectivePayWalletSymbol = payWalletSymbol || payWallets[0]?.symbol || "";
  const selectedWallet = payWallets.find((w) => w.symbol === effectivePayWalletSymbol);
  const usdRate = selectedWallet?.usdRate ?? null;

  const isSubscribed = subscription && new Date(subscription.expiresAt) > new Date();

  function handleUsdAmountChange(next: string) {
    setPrincipal(next);
    const parsed = Number(next);
    if (usdRate != null && usdRate > 0 && next !== "" && !Number.isNaN(parsed)) {
      setTokenAmount((parsed / usdRate).toFixed(8));
    } else {
      setTokenAmount("");
    }
  }

  function handleTokenAmountChange(next: string) {
    setTokenAmount(next);
    const parsed = Number(next);
    if (usdRate != null && next !== "" && !Number.isNaN(parsed)) {
      setPrincipal((parsed * usdRate).toFixed(2));
    } else {
      setPrincipal("");
    }
  }

  async function handleSubscribe() {
    setSubmitting(true);
    try {
      await subscriptionsApi.subscribe(plan.id, term, effectivePayWalletSymbol);
      toast.success(`Subscribed to ${plan.name}`);
      setOpen(false);
      onChanged();
    } catch (error) {
      showFundableError(error, "Subscription failed", router);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePlaceTrade() {
    setSubmitting(true);
    try {
      await investmentsApi.start(plan.id, principal, effectivePayWalletSymbol);
      toast.success(`Trade placed with ${plan.name}`);
      setOpen(false);
      setPrincipal("");
      setTokenAmount("");
      onChanged();
    } catch (error) {
      showFundableError(error, "Could not place trade", router);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="overflow-hidden border-hairline bg-surface py-0">
      {image && !imageFailed ? (
        <div className="relative aspect-video w-full">
          <Image
            src={image}
            alt={plan.name}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />
          {tagline ? (
            <Badge className="absolute bottom-3 left-3 brand-gradient border-0 text-background">{tagline}</Badge>
          ) : null}
          {isSubscribed ? (
            <Badge className="absolute top-3 right-3 gap-1 border-0 bg-status-good/90 text-background">
              <CheckCircle2 className="size-3" /> Subscribed
            </Badge>
          ) : null}
        </div>
      ) : null}
      <CardContent className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            <p className="text-tabular mt-1 text-base font-medium text-status-good">
              {formatRateFrequency(plan.rateRange, plan.payFrequency)}{" "}
              {plan.rateNote ? <span className="text-muted-foreground">{plan.rateNote}</span> : null}
            </p>
          </div>
          {(!image || imageFailed) && isSubscribed ? (
            <Badge className="border-0 bg-status-good/15 text-status-good">Subscribed</Badge>
          ) : null}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <div className="border-t border-hairline pt-4">
            <DialogTrigger
              render={
                <Button size="lg" className="w-full brand-gradient text-background hover:opacity-90">
                  {isSubscribed ? "Place a trade" : "Subscribe"}
                </Button>
              }
            />
          </div>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isSubscribed ? `Place a trade with ${plan.name}` : `Subscribe to ${plan.name}`}</DialogTitle>
            </DialogHeader>

            {isSubscribed ? (
              <>
                <Field>
                  <FieldLabel>Pay from</FieldLabel>
                  <WalletSelect wallets={payWallets} value={effectivePayWalletSymbol} onChange={setPayWalletSymbol} />
                  {selectedWallet ? (
                    <FieldDescription>
                      {selectedWallet.name} balance: {Number(selectedWallet.balance).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </FieldDescription>
                  ) : null}
                </Field>

                <CurrencyAmountField
                  id="tokenAmount"
                  label="Amount in token"
                  value={tokenAmount}
                  onChange={handleTokenAmountChange}
                  currencyCode={effectivePayWalletSymbol ? currencyLabel(effectivePayWalletSymbol) : "TOKEN"}
                  disabled={usdRate == null}
                  placeholder={usdRate == null ? "Price unavailable" : "0.00"}
                />

                <CurrencyAmountField
                  id="principal"
                  label="Amount to trade"
                  value={principal}
                  onChange={handleUsdAmountChange}
                  currencyCode="USD"
                />

                <Field>
                  <FieldDescription>
                    This amount is debited from the wallet above the moment the trade starts, and locked
                    together with any profit until you end the trade.
                    {plan.term
                      ? ` Accrues every ${plan.payFrequency} until the ${plan.term} cycle completes.`
                      : ` Accrues profit every ${plan.payFrequency}.`}
                  </FieldDescription>
                </Field>
              </>
            ) : (
              <>
                <Field>
                  <FieldLabel>Subscription term</FieldLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTerm("SIX_MONTHS")}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-colors",
                        term === "SIX_MONTHS" ? "border-primary bg-primary/10" : "border-input hover:bg-secondary",
                      )}
                    >
                      <p className="text-sm font-medium">6 months</p>
                      <p className="text-tabular text-lg font-semibold">${plan.pricing["6mo"]}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTerm("ONE_YEAR")}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-colors",
                        term === "ONE_YEAR" ? "border-primary bg-primary/10" : "border-input hover:bg-secondary",
                      )}
                    >
                      <p className="text-sm font-medium">1 year</p>
                      <p className="text-tabular text-lg font-semibold">${plan.pricing["1yr"]}</p>
                    </button>
                  </div>
                  <FieldDescription>
                    Your subscription unlocks {plan.name} for the full term. You can place as many trades as
                    you like with it until the term ends.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel>Pay from</FieldLabel>
                  <WalletSelect wallets={payWallets} value={effectivePayWalletSymbol} onChange={setPayWalletSymbol} />
                  <FieldDescription>
                    The subscription fee is charged in USD value from whichever wallet you pick here.
                  </FieldDescription>
                </Field>
              </>
            )}

            <DialogFooter>
              <Button
                disabled={submitting || !effectivePayWalletSymbol || (isSubscribed && !principal)}
                className="w-full brand-gradient text-background hover:opacity-90"
                onClick={isSubscribed ? handlePlaceTrade : handleSubscribe}
              >
                {submitting ? "Working…" : isSubscribed ? "Place trade" : "Subscribe"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
