"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { PaymentAssetSelect } from "@/components/dashboard/payment-asset-select";
import { CurrencyAmountField } from "@/components/dashboard/currency-amount-field";
import {
  subscriptionsApi,
  investmentsApi,
  ApiError,
  type InvestmentPlan,
  type Subscription,
  type SubscriptionPaymentOption,
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
  paymentOptions,
  onChanged,
}: {
  plan: InvestmentPlan;
  subscription?: Subscription;
  image?: string;
  tagline?: string;
  wallets?: Wallet[];
  paymentOptions?: SubscriptionPaymentOption[];
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

  // Subscribing pays the company's own address for the chosen token, not
  // any of the user's wallets, so this is a separate token list and symbol.
  const paySymbols = paymentOptions ?? [];
  const [paySymbol, setPaySymbol] = useState("");
  const effectivePaySymbol = paySymbol || paySymbols[0]?.symbol || "";
  const selectedPayOption = paySymbols.find((o) => o.symbol === effectivePaySymbol);
  const payUsdRate = selectedPayOption?.usdRate ?? null;
  const [txHash, setTxHash] = useState("");

  const feeUsd = term === "SIX_MONTHS" ? (plan.pricing["6mo"] ?? null) : (plan.pricing["1yr"] ?? null);
  const payTokenAmount = feeUsd != null && payUsdRate != null && payUsdRate > 0 ? feeUsd / payUsdRate : null;

  const isSubscribed =
    !!subscription &&
    subscription.status === "ACTIVE" &&
    subscription.expiresAt != null &&
    new Date(subscription.expiresAt) > new Date();
  const isPending = subscription?.status === "PENDING";

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
      await subscriptionsApi.subscribe(plan.id, term, effectivePaySymbol, txHash || undefined);
      toast.success("Payment submitted, awaiting confirmation");
      setOpen(false);
      setTxHash("");
      onChanged();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Subscription failed");
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
          ) : isPending ? (
            <Badge className="absolute top-3 right-3 gap-1 border-0 bg-status-warning/90 text-background">
              <Clock className="size-3" /> Payment pending
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
          ) : (!image || imageFailed) && isPending ? (
            <Badge className="border-0 bg-status-warning/15 text-status-warning">Payment pending</Badge>
          ) : null}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <div className="border-t border-hairline pt-4">
            {isPending ? (
              <Button size="lg" className="w-full" variant="outline" disabled>
                Awaiting confirmation
              </Button>
            ) : (
              <DialogTrigger
                render={
                  <Button size="lg" className="w-full brand-gradient text-background hover:opacity-90">
                    {isSubscribed ? "Place a trade" : "Subscribe"}
                  </Button>
                }
              />
            )}
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
                      ? ` Accrues every ${plan.payFrequency} for ${plan.term}.`
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
                  <FieldLabel>Pay with</FieldLabel>
                  <PaymentAssetSelect options={paySymbols} value={effectivePaySymbol} onChange={setPaySymbol} />
                  {feeUsd != null ? (
                    <FieldDescription>
                      {payTokenAmount != null
                        ? `${payTokenAmount.toFixed(8)} ${currencyLabel(effectivePaySymbol)} `
                        : ""}
                      (${feeUsd.toLocaleString()}) for the {term === "SIX_MONTHS" ? "6 month" : "1 year"} term.
                    </FieldDescription>
                  ) : null}
                </Field>

                {selectedPayOption ? (
                  <Field>
                    <FieldLabel>Send payment to</FieldLabel>
                    <Input readOnly value={selectedPayOption.address} />
                    <div className="mt-2 flex w-fit items-center justify-center rounded-xl border border-hairline bg-background p-3">
                      <QRCodeSVG value={selectedPayOption.address} size={128} />
                    </div>
                    <FieldDescription>
                      Send only {currencyLabel(effectivePaySymbol)} to this address, then submit below. Your
                      subscription activates once the payment is confirmed.
                    </FieldDescription>
                  </Field>
                ) : (
                  <FieldDescription>No token is currently accepted for payment, check back shortly.</FieldDescription>
                )}

                <Field>
                  <FieldLabel htmlFor="txHash">Transaction hash (optional)</FieldLabel>
                  <Input id="txHash" value={txHash} onChange={(e) => setTxHash(e.target.value)} />
                </Field>
              </>
            )}

            <DialogFooter>
              <Button
                disabled={
                  submitting ||
                  (isSubscribed ? !effectivePayWalletSymbol || !principal : !effectivePaySymbol)
                }
                className="w-full brand-gradient text-background hover:opacity-90"
                onClick={isSubscribed ? handlePlaceTrade : handleSubscribe}
              >
                {submitting ? "Working…" : isSubscribed ? "Place trade" : "I've sent the payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
