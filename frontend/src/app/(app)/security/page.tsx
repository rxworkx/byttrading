"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronRight, KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  getMe,
  setTwoFactor,
  setAutoWithdrawal,
  changePassword,
  resendVerification,
  ApiError,
  type PublicUser,
} from "@/lib/auth-client";
import { settingsApi } from "@/lib/dashboard-api";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function SecurityPage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [withdrawalDay, setWithdrawalDay] = useState<string | null>(null);
  const [togglingTwoFactor, setTogglingTwoFactor] = useState(false);
  const [togglingAutoWithdrawal, setTogglingAutoWithdrawal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    getMe().then(setUser);
    settingsApi.public().then((settings) => {
      const day = settings.find((s) => s.key === "withdrawal_day_of_month");
      if (day) setWithdrawalDay(day.value);
    });
  }, []);

  async function handleToggleTwoFactor(enabled: boolean) {
    if (!user) return;
    setTogglingTwoFactor(true);
    try {
      const result = await setTwoFactor(enabled);
      setUser({ ...user, twoFactorEnabled: result.twoFactorEnabled });
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update two factor login");
    } finally {
      setTogglingTwoFactor(false);
    }
  }

  async function handleToggleAutoWithdrawal(enabled: boolean) {
    if (!user) return;
    setTogglingAutoWithdrawal(true);
    try {
      const result = await setAutoWithdrawal(enabled);
      setUser({ ...user, autoWithdrawalEnabled: result.autoWithdrawalEnabled });
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update auto withdrawal");
    } finally {
      setTogglingAutoWithdrawal(false);
    }
  }

  async function handleResendVerification() {
    if (!user) return;
    await resendVerification(user.email);
    toast.success("If verification is needed, an email is on its way.");
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success("Password updated");
      reset();
      setShowPasswordForm(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update password");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Security</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Email verification and two factor login are both optional layers you can turn on when you want
          them.
        </p>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Email verification</h2>
            <p className="mt-1 text-sm text-muted-foreground">Optional. Confirms this email address belongs to you.</p>
          </div>
          {user.isEmailVerified ? (
            <span className="flex items-center gap-1.5 text-sm font-medium text-status-good">
              <ShieldCheck className="size-4" /> Verified
            </span>
          ) : (
            <Button variant="outline" size="sm" onClick={handleResendVerification}>
              Send verification email
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Two factor login</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Optional. When enabled, we email a one time code every time you log in.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user.twoFactorEnabled ? (
              <ShieldCheck className="size-4 text-status-good" />
            ) : (
              <ShieldOff className="size-4 text-muted-foreground" />
            )}
            <Switch
              checked={user.twoFactorEnabled}
              disabled={togglingTwoFactor}
              onCheckedChange={(checked) => handleToggleTwoFactor(checked === true)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Auto withdrawal</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {withdrawalDay
                ? `When active, withdrawals would run automatically on day ${withdrawalDay} of every month.`
                : "When active, withdrawals would run automatically on a scheduled day every month."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Not active yet. This only saves your preference for when it launches.
            </p>
          </div>
          <Switch
            checked={user.autoWithdrawalEnabled}
            disabled={togglingAutoWithdrawal}
            onCheckedChange={(checked) => handleToggleAutoWithdrawal(checked === true)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-6">
        <button
          type="button"
          onClick={() => setShowPasswordForm((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-secondary">
              <KeyRound className="size-4 text-primary" />
            </span>
            <div>
              <h2 className="font-semibold">Change password</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Update the password used to log in.</p>
            </div>
          </div>
          <ChevronRight className={`size-4 shrink-0 text-muted-foreground transition-transform ${showPasswordForm ? "rotate-90" : ""}`} />
        </button>

        {showPasswordForm ? (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 border-t border-hairline pt-6">
            <FieldGroup>
              <Field data-invalid={!!errors.currentPassword}>
                <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
                <Input id="currentPassword" type="password" autoComplete="current-password" {...register("currentPassword")} />
                <FieldError errors={errors.currentPassword ? [errors.currentPassword] : undefined} />
              </Field>
              <Field data-invalid={!!errors.newPassword}>
                <FieldLabel htmlFor="newPassword">New password</FieldLabel>
                <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
                <FieldError errors={errors.newPassword ? [errors.newPassword] : undefined} />
              </Field>
              <Field data-invalid={!!errors.confirmPassword}>
                <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
                <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
                <FieldError errors={errors.confirmPassword ? [errors.confirmPassword] : undefined} />
                <FieldDescription>Use at least 8 characters.</FieldDescription>
              </Field>
              <Button type="submit" disabled={submitting} className="w-full brand-gradient text-background hover:opacity-90">
                {submitting ? "Updating…" : "Update password"}
              </Button>
            </FieldGroup>
          </form>
        ) : null}
      </div>
    </div>
  );
}
