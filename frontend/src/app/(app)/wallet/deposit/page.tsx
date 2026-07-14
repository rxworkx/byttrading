"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { WalletSelect } from "@/components/dashboard/wallet-select";
import { CurrencyAmountField } from "@/components/dashboard/currency-amount-field";
import { walletsApi, ApiError, type Wallet } from "@/lib/dashboard-api";
import { currencyLabel, sortWalletsByBalance } from "@/lib/asset-labels";

export default function DepositPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [usdAmount, setUsdAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    walletsApi.list().then((raw) => {
      const data = sortWalletsByBalance(raw);
      setWallets(data);
      setSymbol(data[0]?.symbol ?? "");
    });
  }, []);

  const selectedWallet = wallets.find((w) => w.symbol === symbol);
  const usdRate = selectedWallet?.usdRate ?? null;

  function handleTokenAmountChange(next: string) {
    setAmount(next);
    const parsed = Number(next);
    if (usdRate != null && next !== "" && !Number.isNaN(parsed)) {
      setUsdAmount((parsed * usdRate).toFixed(2));
    } else {
      setUsdAmount("");
    }
  }

  function handleUsdAmountChange(next: string) {
    setUsdAmount(next);
    const parsed = Number(next);
    if (usdRate != null && usdRate > 0 && next !== "" && !Number.isNaN(parsed)) {
      setAmount((parsed / usdRate).toFixed(8));
    } else {
      setAmount("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tx = await walletsApi.deposit(symbol, amount, txHash || undefined);
      toast.success("Deposit submitted.");
      router.push(`/transactions/detail?id=${tx.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Deposit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Deposit</h1>
      <p className="mt-1 text-base text-muted-foreground">
        Send funds to your wallet, then submit the details below for review.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field>
          <FieldLabel>Wallet</FieldLabel>
          <WalletSelect wallets={wallets} value={symbol} onChange={setSymbol} />
        </Field>

        {selectedWallet?.depositAddress ? (
          <Field>
            <FieldLabel>Deposit address</FieldLabel>
            <Input readOnly value={selectedWallet.depositAddress} />
            <FieldDescription>Send only {currencyLabel(selectedWallet.symbol)} to this address.</FieldDescription>
            <div className="mt-2 flex w-fit items-center justify-center rounded-xl border border-hairline bg-background p-3">
              <QRCodeSVG value={selectedWallet.depositAddress} size={144} />
            </div>
          </Field>
        ) : null}

        <CurrencyAmountField
          id="amount"
          label="Amount"
          value={amount}
          onChange={handleTokenAmountChange}
          currencyCode={symbol ? currencyLabel(symbol) : "TOKEN"}
        />

        <CurrencyAmountField
          id="usdAmount"
          label="Amount in USD"
          value={usdAmount}
          onChange={handleUsdAmountChange}
          currencyCode="USD"
          disabled={usdRate == null}
          placeholder={usdRate == null ? "Price unavailable" : "0.00"}
        />

        <Field>
          <FieldLabel htmlFor="txHash">Transaction hash (optional)</FieldLabel>
          <Input id="txHash" value={txHash} onChange={(e) => setTxHash(e.target.value)} />
        </Field>

        <Button
          type="submit"
          disabled={submitting || !symbol || !amount}
          className="w-full brand-gradient text-background hover:opacity-90"
        >
          {submitting ? "Submitting…" : "Submit deposit"}
        </Button>
      </form>
    </div>
  );
}
