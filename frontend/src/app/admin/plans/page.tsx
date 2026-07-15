"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { adminPlansApi } from "@/lib/admin-api";
import { ApiError, type InvestmentPlan } from "@/lib/dashboard-api";

function PlanCard({ plan, onSaved }: { plan: InvestmentPlan; onSaved: () => void }) {
  const [rateRange, setRateRange] = useState(plan.rateRange);
  const [sixMo, setSixMo] = useState(String(plan.pricing["6mo"] ?? ""));
  const [oneYr, setOneYr] = useState(String(plan.pricing["1yr"] ?? ""));
  const [term, setTerm] = useState(plan.term ?? "");
  const [payFrequency, setPayFrequency] = useState(plan.payFrequency);
  const [payWalletFrequency, setPayWalletFrequency] = useState(plan.payWalletFrequency ?? "");
  const [minTerm, setMinTerm] = useState(plan.minTerm);
  const [isActive, setIsActive] = useState(plan.isActive);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await adminPlansApi.update(plan.id, {
        rateRange,
        pricing: {
          "6mo": sixMo ? Number(sixMo) : undefined,
          "1yr": oneYr ? Number(oneYr) : undefined,
        },
        term: term === "" ? null : term,
        payFrequency,
        payWalletFrequency: payWalletFrequency === "" ? null : payWalletFrequency,
        minTerm,
        isActive,
      });
      toast.success(`${plan.name} updated`);
      onSaved();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-hairline bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{plan.name}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Active</span>
          <Switch checked={isActive} onCheckedChange={(checked) => setIsActive(checked === true)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${plan.id}-rate`}>Rate range</FieldLabel>
          <Input id={`${plan.id}-rate`} value={rateRange} onChange={(e) => setRateRange(e.target.value)} placeholder="0.25-0.6" />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${plan.id}-cycle`}>Term, e.g. &quot;5 days&quot; (blank = no fixed cycle)</FieldLabel>
          <Input
            id={`${plan.id}-cycle`}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="No fixed cycle"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${plan.id}-6mo`}>6 month price ($)</FieldLabel>
          <Input id={`${plan.id}-6mo`} inputMode="decimal" value={sixMo} onChange={(e) => setSixMo(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${plan.id}-1yr`}>1 year price ($)</FieldLabel>
          <Input id={`${plan.id}-1yr`} inputMode="decimal" value={oneYr} onChange={(e) => setOneYr(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${plan.id}-freq`}>Pay frequency, e.g. &quot;1 day&quot;</FieldLabel>
          <Input
            id={`${plan.id}-freq`}
            value={payFrequency}
            onChange={(e) => setPayFrequency(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${plan.id}-hold`}>Minimum term, e.g. &quot;0 days&quot;</FieldLabel>
          <Input id={`${plan.id}-hold`} value={minTerm} onChange={(e) => setMinTerm(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${plan.id}-wallet-freq`}>
            Pay-to-wallet frequency (reserved, not used yet)
          </FieldLabel>
          <Input
            id={`${plan.id}-wallet-freq`}
            value={payWalletFrequency}
            onChange={(e) => setPayWalletFrequency(e.target.value)}
            placeholder="Not set"
          />
        </Field>
      </div>

      <Button size="sm" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<InvestmentPlan[] | null>(null);

  const load = useCallback(() => {
    adminPlansApi.list().then(setPlans);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Plans</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Edit terms for the existing bots. Leaving term blank means the trade has no fixed end, the
          investor ends it whenever they choose.
        </p>
      </div>

      {!plans ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onSaved={load} />
          ))}
        </div>
      )}
    </div>
  );
}
