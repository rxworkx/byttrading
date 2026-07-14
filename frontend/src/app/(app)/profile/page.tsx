"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, Copy, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { CountrySelect } from "@/components/shared/country-select";
import { PhoneInput } from "@/components/shared/phone-input";
import { getMe, updateProfile, ApiError, type PublicUser } from "@/lib/auth-client";
import { kycApi, type KycRecord } from "@/lib/dashboard-api";

const kycBadge: Record<KycRecord["status"], { label: string; className: string }> = {
  NOT_SUBMITTED: { label: "Not submitted", className: "bg-secondary text-foreground" },
  PENDING: { label: "Pending review", className: "bg-status-warning/15 text-status-warning" },
  APPROVED: { label: "Approved", className: "bg-status-good/15 text-status-good" },
  REJECTED: { label: "Rejected", className: "bg-destructive/15 text-destructive" },
};

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    getMe().then(setUser);
    kycApi.mine().then(setKyc);
  }, []);

  function copyReferralCode() {
    if (!user) return;
    navigator.clipboard.writeText(user.referralCode);
    toast.success("Referral code copied");
  }

  function startEditing() {
    if (!user) return;
    reset({
      firstName: user.firstName,
      lastName: user.lastName,
    });
    setPhone(user.phone ?? "");
    setCountry(user.country ?? "");
    setEditing(true);
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const updated = await updateProfile({ ...values, phone, country });
      setUser(updated);
      setEditing(false);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update profile");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-base text-muted-foreground">Your personal details and identity status.</p>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full brand-gradient text-2xl font-semibold text-background">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </span>
            <div>
              <p className="text-lg font-semibold">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.phone || user.country ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {[user.phone, user.country].filter(Boolean).join(", ")}
                </p>
              ) : null}
            </div>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="size-3.5" /> Edit
            </Button>
          ) : null}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 border-t border-hairline pt-6">
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.firstName}>
                  <FieldLabel htmlFor="firstName">First name</FieldLabel>
                  <Input id="firstName" {...register("firstName")} />
                  <FieldError errors={errors.firstName ? [errors.firstName] : undefined} />
                </Field>
                <Field data-invalid={!!errors.lastName}>
                  <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                  <Input id="lastName" {...register("lastName")} />
                  <FieldError errors={errors.lastName ? [errors.lastName] : undefined} />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Country (optional)</FieldLabel>
                  <CountrySelect value={country || null} onChange={setCountry} />
                </Field>
                <Field>
                  <FieldLabel>Phone (optional)</FieldLabel>
                  <PhoneInput value={phone || null} onChange={setPhone} />
                </Field>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={submitting} className="flex-1 brand-gradient text-background hover:opacity-90">
                  {submitting ? "Saving…" : "Save changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  <X className="size-4" /> Cancel
                </Button>
              </div>
            </FieldGroup>
          </form>
        ) : (
          <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-hairline pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Email verification</dt>
              <dd className="mt-1">
                {user.isEmailVerified ? (
                  <Badge className="border-0 bg-status-good/15 text-status-good">
                    <BadgeCheck className="mr-1 size-3" /> Verified
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Not verified yet (optional),{" "}
                    <Link href="/verify-email" className="font-medium text-primary hover:underline">
                      verify now
                    </Link>
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Referral code</dt>
              <dd className="mt-1 flex items-center gap-2">
                <span className="text-tabular font-medium">{user.referralCode}</span>
                <Button variant="ghost" size="icon-sm" onClick={copyReferralCode}>
                  <Copy className="size-3.5" />
                </Button>
              </dd>
            </div>
          </dl>
        )}
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Identity verification (KYC)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Optional, but required before large withdrawals can be approved.
            </p>
          </div>
          {kyc ? <Badge className={`border-0 ${kycBadge[kyc.status].className}`}>{kycBadge[kyc.status].label}</Badge> : null}
        </div>
        {kyc?.status === "REJECTED" && kyc.rejectionReason ? (
          <p className="mt-3 text-sm text-destructive">{kyc.rejectionReason}</p>
        ) : null}
        {kyc?.status !== "APPROVED" ? (
          <Button variant="outline" className="mt-4 w-full" nativeButton={false} render={<Link href="/kyc">Manage KYC</Link>} />
        ) : null}
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-6">
        <h2 className="font-semibold">Account security</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your password and two factor login from the Security page.
        </p>
        <Button variant="outline" className="mt-4 w-full" nativeButton={false} render={<Link href="/security">Go to security</Link>} />
      </div>
    </div>
  );
}
