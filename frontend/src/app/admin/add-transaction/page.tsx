"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPicker } from "@/components/admin/user-picker";
import {
  adminApi,
  adminManualTransactionApi,
  adminPlansApi,
  type AdminUser,
  type ManualTransactionActionType,
} from "@/lib/admin-api";
import { ApiError, type InvestmentPlan } from "@/lib/dashboard-api";
import { ASSET_ICONS, currencyLabel } from "@/lib/asset-labels";

const SYMBOLS = Object.keys(ASSET_ICONS);

const ACTION_TYPES: { value: ManualTransactionActionType; label: string }[] = [
  { value: "DEPOSIT", label: "Deposit" },
  { value: "WITHDRAWAL", label: "Withdrawal" },
  { value: "PLACE_TRADE", label: "Place a trade" },
  { value: "BUY_SUBSCRIPTION", label: "Buy plan subscription" },
  { value: "ADJUSTMENT", label: "Generic adjustment" },
];

const TERMS: { value: "SIX_MONTHS" | "ONE_YEAR"; label: string }[] = [
  { value: "SIX_MONTHS", label: "6 months" },
  { value: "ONE_YEAR", label: "1 year" },
];

function AddTransactionContent() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [userId, setUserId] = useState(searchParams.get("userId") ?? "");
  const [actionType, setActionType] = useState<ManualTransactionActionType>("DEPOSIT");
  const [symbol, setSymbol] = useState("fiat_usd");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [planId, setPlanId] = useState("");
  const [term, setTerm] = useState<"SIX_MONTHS" | "ONE_YEAR">("SIX_MONTHS");
  const [walletSymbol, setWalletSymbol] = useState("fiat_usd");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    adminApi.users().then(setUsers);
    adminPlansApi.list().then(setPlans);
  }, []);

  const selectedPlan = plans.find((p) => p.id === planId);

  function resetFields() {
    setAmount("");
    setNote("");
  }

  const requiresSymbolAmount = actionType === "DEPOSIT" || actionType === "WITHDRAWAL" || actionType === "ADJUSTMENT";
  const requiresPlaceTrade = actionType === "PLACE_TRADE";
  const requiresSubscription = actionType === "BUY_SUBSCRIPTION";

  const canSubmit =
    !!userId &&
    (requiresSymbolAmount
      ? !!symbol && !!amount
      : requiresPlaceTrade
        ? !!planId && !!amount && !!walletSymbol
        : requiresSubscription
          ? !!planId && !!term && !!walletSymbol
          : false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await adminManualTransactionApi.create({
        userId,
        actionType,
        symbol: requiresSymbolAmount ? symbol : undefined,
        amount: requiresSymbolAmount || requiresPlaceTrade ? amount : undefined,
        planId: requiresPlaceTrade || requiresSubscription ? planId : undefined,
        term: requiresSubscription ? term : undefined,
        walletSymbol: requiresPlaceTrade || requiresSubscription ? walletSymbol : undefined,
        note: note || undefined,
      });
      toast.success("Transaction created");
      resetFields();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not create transaction");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add transaction</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Post a deposit, withdrawal, trade or subscription on behalf of a user.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-hairline bg-surface p-6">
        <Field>
          <FieldLabel>User</FieldLabel>
          <UserPicker users={users} value={userId} onChange={setUserId} />
        </Field>

        <Field>
          <FieldLabel>Action</FieldLabel>
          <Select value={actionType} onValueChange={(v) => v && setActionType(v as ManualTransactionActionType)}>
            <SelectTrigger className="w-full">
              <SelectValue>{ACTION_TYPES.find((a) => a.value === actionType)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {requiresSymbolAmount ? (
          <>
            <Field>
              <FieldLabel>Wallet</FieldLabel>
              <Select value={symbol} onValueChange={(v) => v && setSymbol(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{currencyLabel(symbol)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SYMBOLS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {currencyLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="amount">Amount</FieldLabel>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder={actionType === "WITHDRAWAL" ? "e.g. 50" : "e.g. 50 to credit, -20 to debit"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {actionType === "ADJUSTMENT" ? (
                <FieldDescription>Positive credits the wallet, negative debits it.</FieldDescription>
              ) : null}
            </Field>
          </>
        ) : null}

        {requiresPlaceTrade ? (
          <>
            <Field>
              <FieldLabel>Plan</FieldLabel>
              <Select value={planId} onValueChange={(v) => v && setPlanId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a plan">{selectedPlan?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>The user needs an active subscription to this plan already.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Fund from</FieldLabel>
              <Select value={walletSymbol} onValueChange={(v) => v && setWalletSymbol(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{currencyLabel(walletSymbol)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SYMBOLS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {currencyLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="amount">Principal</FieldLabel>
              <Input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              <FieldDescription>Debited from the wallet selected above.</FieldDescription>
            </Field>
          </>
        ) : null}

        {requiresSubscription ? (
          <>
            <Field>
              <FieldLabel>Plan</FieldLabel>
              <Select value={planId} onValueChange={(v) => v && setPlanId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a plan">{selectedPlan?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Term</FieldLabel>
              <Select value={term} onValueChange={(v) => v && setTerm(v as "SIX_MONTHS" | "ONE_YEAR")}>
                <SelectTrigger className="w-full">
                  <SelectValue>{TERMS.find((t) => t.value === term)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Pay with</FieldLabel>
              <Select value={walletSymbol} onValueChange={(v) => v && setWalletSymbol(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{currencyLabel(walletSymbol)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SYMBOLS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {currencyLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        ) : null}

        <Field>
          <FieldLabel htmlFor="note">Note (optional)</FieldLabel>
          <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for this action" />
        </Field>

        <Button
          type="submit"
          disabled={submitting || !canSubmit}
          className="w-full brand-gradient text-background hover:opacity-90"
        >
          {submitting ? "Submitting…" : "Create transaction"}
        </Button>
      </form>
    </div>
  );
}

export default function AdminAddTransactionPage() {
  return (
    <Suspense>
      <AddTransactionContent />
    </Suspense>
  );
}
