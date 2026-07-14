"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { CountrySelect } from "@/components/shared/country-select";
import { PhoneInput } from "@/components/shared/phone-input";
import {
  adminApi,
  type AdminUserDetail,
  type AdminUserReferrals,
  type UserStatus,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/dashboard-api";
import { formatDateTime, formatLabel } from "@/lib/utils";

const STATUS_BUTTONS: { value: UserStatus; label: string; className: string }[] = [
  { value: "ACTIVE", label: "Set Active", className: "bg-status-good text-white hover:opacity-90" },
  { value: "AWAITING", label: "Set Awaiting", className: "bg-status-warning text-white hover:opacity-90" },
  { value: "SUSPENDED", label: "Set Suspended", className: "bg-destructive text-white hover:opacity-90" },
  { value: "DISABLED", label: "Set Disabled", className: "bg-foreground text-background hover:opacity-90" },
];

// One colored button per status, acting on this single user (not a bulk
// selection). The button matching the current status is shown disabled so
// it reads as "you are here" rather than an inert duplicate action.
function UserStatusButtons({
  value,
  onChange,
}: {
  value: UserStatus;
  onChange: (status: UserStatus) => void | Promise<void>;
}) {
  const [saving, setSaving] = useState<UserStatus | null>(null);

  async function handleClick(status: UserStatus) {
    setSaving(status);
    try {
      await onChange(status);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_BUTTONS.map((btn) => (
        <Button
          key={btn.value}
          size="sm"
          className={btn.className}
          disabled={btn.value === value || saving !== null}
          onClick={() => handleClick(btn.value)}
        >
          {btn.value === value ? `${btn.label.replace("Set ", "")} (current)` : btn.label}
        </Button>
      ))}
    </div>
  );
}

function formatUsd(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ProfileEditForm({ detail, onSaved }: { detail: AdminUserDetail; onSaved: () => void }) {
  const { user } = detail;
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [country, setCountry] = useState(user.country ?? "");
  const [saving, setSaving] = useState(false);

  const dirty =
    firstName !== user.firstName ||
    lastName !== user.lastName ||
    email !== user.email ||
    phone !== (user.phone ?? "") ||
    country !== (user.country ?? "");

  async function save() {
    setSaving(true);
    try {
      await adminApi.updateUserProfile(user.id, { firstName, lastName, email, phone, country });
      toast.success("Profile updated");
      onSaved();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="firstName">First name</FieldLabel>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="lastName">Last name</FieldLabel>
          <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel>Country</FieldLabel>
          <CountrySelect value={country || null} onChange={setCountry} />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel>Phone</FieldLabel>
          <PhoneInput value={phone || null} onChange={setPhone} />
        </Field>
        <Field>
          <FieldLabel>Referral code</FieldLabel>
          <Input value={user.referralCode} disabled />
          <FieldDescription>Read only.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Joined</FieldLabel>
          <Input value={formatDateTime(user.createdAt)} disabled />
        </Field>
        <Field>
          <FieldLabel>Last login</FieldLabel>
          <Input value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"} disabled />
        </Field>
      </div>
      <Button className="mt-4" onClick={save} disabled={!dirty || saving}>
        {saving ? "Saving…" : "Save profile"}
      </Button>
    </div>
  );
}

function AccessControlsCard({ detail, onSaved }: { detail: AdminUserDetail; onSaved: () => void }) {
  const { user } = detail;
  const [maxWithdrawal, setMaxWithdrawal] = useState(
    user.txLimit?.maxWithdrawal != null ? String(user.txLimit.maxWithdrawal) : "",
  );
  const [savingMaxWithdrawal, setSavingMaxWithdrawal] = useState(false);
  const maxWithdrawalDirty = maxWithdrawal !== (user.txLimit?.maxWithdrawal != null ? String(user.txLimit.maxWithdrawal) : "");

  async function toggle(field: "isEmailVerified" | "twoFactorEnabled" | "freeze", value: boolean) {
    try {
      if (field === "freeze") {
        await adminApi.setUserTxLimit(user.id, { freeze: value });
      } else {
        await adminApi.setUserVerification(user.id, { [field]: value });
      }
      onSaved();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update");
    }
  }

  async function saveMaxWithdrawal() {
    setSavingMaxWithdrawal(true);
    try {
      await adminApi.setUserTxLimit(user.id, {
        maxWithdrawal: maxWithdrawal === "" ? null : Number(maxWithdrawal),
      });
      toast.success("Max withdrawal updated");
      onSaved();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update max withdrawal");
    } finally {
      setSavingMaxWithdrawal(false);
    }
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6">
      <h2 className="font-semibold">Access controls</h2>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-secondary/60 p-3">
          <span className="text-sm">Email verified</span>
          <Switch checked={user.isEmailVerified} onCheckedChange={(v) => toggle("isEmailVerified", v === true)} />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-secondary/60 p-3">
          <span className="text-sm">Two factor login</span>
          <Switch checked={user.twoFactorEnabled} onCheckedChange={(v) => toggle("twoFactorEnabled", v === true)} />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-secondary/60 p-3">
          <span className="text-sm">Freeze account</span>
          <Switch checked={user.txLimit?.freeze ?? false} onCheckedChange={(v) => toggle("freeze", v === true)} />
        </div>
      </div>

      <Field className="mt-4">
        <FieldLabel htmlFor="maxWithdrawal">Max withdrawal override (USD)</FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            id="maxWithdrawal"
            inputMode="decimal"
            placeholder="Platform default"
            value={maxWithdrawal}
            onChange={(e) => setMaxWithdrawal(e.target.value)}
          />
          <Button size="sm" onClick={saveMaxWithdrawal} disabled={!maxWithdrawalDirty || savingMaxWithdrawal}>
            Save
          </Button>
        </div>
        <FieldDescription>Leave blank to use the platform default max withdrawal setting.</FieldDescription>
      </Field>
    </div>
  );
}

function UplineDownlinesCard({ userId }: { userId: string }) {
  const [referrals, setReferrals] = useState<AdminUserReferrals | null>(null);

  useEffect(() => {
    adminApi.getUserReferrals(userId).then(setReferrals);
  }, [userId]);

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6">
      <h2 className="font-semibold">Referral network</h2>
      {!referrals ? (
        <Skeleton className="mt-3 h-16 w-full rounded-xl" />
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Upline (referred by)</p>
            {referrals.upline ? (
              <Link
                href={`/admin/users/detail?userId=${referrals.upline.id}`}
                className="mt-1 block rounded-xl bg-secondary/60 p-3 text-sm font-medium text-primary hover:underline"
              >
                {referrals.upline.firstName} {referrals.upline.lastName} ({referrals.upline.email})
              </Link>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No referrer.</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Downlines ({referrals.downlines.length})</p>
            {referrals.downlines.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">Nobody referred yet.</p>
            ) : (
              <div className="mt-1 space-y-1.5">
                {referrals.downlines.map((d) => (
                  <Link
                    key={d.id}
                    href={`/admin/users/detail?userId=${d.id}`}
                    className="block rounded-xl bg-secondary/60 p-3 text-sm font-medium text-primary hover:underline"
                  >
                    {d.firstName} {d.lastName} ({d.email})
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminUserDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("userId") ?? "";
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [savingRole, setSavingRole] = useState(false);

  const load = useCallback(() => {
    adminApi.userDetail(id).then(setDetail);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleRole() {
    if (!detail) return;
    const nextRole = detail.user.role === "ADMIN" ? "USER" : "ADMIN";
    setSavingRole(true);
    try {
      await adminApi.setUserRole(id, nextRole);
      toast.success(`Role updated to ${formatLabel(nextRole)}`);
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update role");
    } finally {
      setSavingRole(false);
    }
  }

  async function changeStatus(status: string) {
    try {
      await adminApi.setUserStatus(id, status as UserStatus);
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update status");
    }
  }

  if (!detail) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const { user, stats } = detail;

  const statLines = [
    { label: "Balance", value: stats.balanceUsd },
    { label: "Trades", value: stats.tradesUsd },
    { label: "Active Trades", value: stats.activeTradesUsd },
    { label: "Earnings", value: stats.earningsUsd },
    { label: "Referral Commission", value: stats.referralCommissionUsd },
    { label: "Deposits", value: stats.depositsUsd },
    { label: "Withdrawals", value: stats.withdrawalsUsd },
  ];

  const actionLinks = [
    { label: "Add A Transaction", href: `/admin/add-transaction?userId=${id}` },
    { label: "Send Notification", href: `/admin/send-notification?userId=${id}` },
    { label: "Transactions", href: `/admin/ledger?userId=${id}` },
    { label: "Tradings", href: `/admin/tradings?userId=${id}` },
    { label: "Subscriptions", href: `/admin/subscriptions?userId=${id}` },
    { label: "Wallets", href: `/admin/users/wallets?userId=${id}` },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            {user.firstName} {user.lastName} <span>| {user.referralCode}</span>
          </h1>
          <p className="mt-1 text-base text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" onClick={toggleRole} disabled={savingRole}>
          {user.role === "ADMIN" ? "Remove admin role" : "Make admin"}
        </Button>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Status</h2>
        <div className="mt-3">
          <UserStatusButtons value={user.status} onChange={changeStatus} />
        </div>
      </div>

      <div className="max-w-3xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          {statLines.map((line) => (
            <div key={line.label}>
              <p className="text-xs text-muted-foreground">{line.label}</p>
              <p className="text-tabular text-sm font-semibold">{formatUsd(line.value)} USD</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {actionLinks.map((action) => (
          <Button key={action.href} variant="outline" size="sm" nativeButton={false} render={<Link href={action.href}>{action.label}</Link>} />
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Profile</h2>
        <div className="mt-3">
          <ProfileEditForm detail={detail} onSaved={load} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AccessControlsCard detail={detail} onSaved={load} />
        <UplineDownlinesCard userId={id} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-hairline bg-surface p-4">
          <p className="text-xs text-muted-foreground">Role</p>
          <Badge className={`mt-2 border-0 ${user.role === "ADMIN" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
            {formatLabel(user.role)}
          </Badge>
        </div>
        <div className="rounded-2xl border border-hairline bg-surface p-4">
          <p className="text-xs text-muted-foreground">KYC status</p>
          <p className="mt-2 text-sm font-medium">{formatLabel(detail.kyc.status)}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  return (
    <Suspense>
      <AdminUserDetailContent />
    </Suspense>
  );
}
