"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { WalletSelect } from "@/components/dashboard/wallet-select";
import { walletsApi, ApiError, type Wallet } from "@/lib/dashboard-api";
import { sortWalletsByBalance } from "@/lib/asset-labels";

export default function TransferPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [fromSymbol, setFromSymbol] = useState("");
  const [toSymbol, setToSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    walletsApi.list().then((raw) => {
      const data = sortWalletsByBalance(raw);
      setWallets(data);
      const fiat = data.find((w) => w.isFiat);
      setFromSymbol(fiat?.symbol ?? data[0]?.symbol ?? "");
      setToSymbol(data.find((w) => w.symbol !== fiat?.symbol)?.symbol ?? data[1]?.symbol ?? "");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { transaction } = await walletsApi.transfer(fromSymbol, toSymbol, amount);
      toast.success("Transfer complete.");
      router.push(`/transactions/detail?id=${transaction.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Transfer</h1>
      <p className="mt-1 text-base text-muted-foreground">
        Move funds between your wallets.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <Field>
          <FieldLabel>From</FieldLabel>
          <WalletSelect wallets={wallets} value={fromSymbol} onChange={setFromSymbol} />
        </Field>

        <div className="flex justify-center">
          <ArrowDown className="size-4 text-muted-foreground" />
        </div>

        <Field>
          <FieldLabel>To</FieldLabel>
          <WalletSelect wallets={wallets} value={toSymbol} onChange={setToSymbol} />
        </Field>

        <Field>
          <FieldLabel htmlFor="amount">Amount</FieldLabel>
          <Input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>

        <Button
          type="submit"
          disabled={submitting || !fromSymbol || !toSymbol || fromSymbol === toSymbol || !amount}
          className="w-full brand-gradient text-background hover:opacity-90"
        >
          {submitting ? "Transferring…" : "Transfer"}
        </Button>
      </form>
    </div>
  );
}
