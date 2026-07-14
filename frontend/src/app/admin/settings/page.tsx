"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { adminSettingsApi, type AdminSetting } from "@/lib/admin-api";
import { ApiError } from "@/lib/dashboard-api";
import { getMe, updateProfile, changePassword, type PublicUser } from "@/lib/auth-client";

function SettingRow({ setting, onSaved }: { setting: AdminSetting; onSaved: () => void }) {
  const [value, setValue] = useState(setting.value);
  const [saving, setSaving] = useState(false);
  const dirty = value !== setting.value;

  async function save() {
    setSaving(true);
    try {
      await adminSettingsApi.setValue(setting.key, value);
      toast.success(`${setting.key} updated`);
      onSaved();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save setting");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Field>
      <FieldLabel htmlFor={setting.key}>{setting.key}</FieldLabel>
      <div className="flex items-center gap-2">
        <Input id={setting.key} value={value} onChange={(e) => setValue(e.target.value)} className="flex-1" />
        <Button size="sm" onClick={save} disabled={!dirty || saving}>
          Save
        </Button>
      </div>
      {setting.description ? <FieldDescription>{setting.description}</FieldDescription> : null}
    </Field>
  );
}

function AdminProfileSection({ user, onSaved }: { user: PublicUser; onSaved: (user: PublicUser) => void }) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);
  const dirty = firstName !== user.firstName || lastName !== user.lastName || email !== user.email;

  async function save() {
    setSaving(true);
    try {
      const updated = await updateProfile({ firstName, lastName, email });
      onSaved(updated);
      toast.success("Admin profile updated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6">
      <h2 className="font-semibold">Your admin profile</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="admin-firstName">First name</FieldLabel>
          <Input id="admin-firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="admin-lastName">Last name</FieldLabel>
          <Input id="admin-lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="admin-email">Email</FieldLabel>
          <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      <Button className="mt-4" onClick={save} disabled={!dirty || saving}>
        {saving ? "Saving…" : "Save profile"}
      </Button>
    </div>
  );
}

function AdminPasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;

  async function save() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6">
      <h2 className="font-semibold">Change password</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="admin-current-password">Current password</FieldLabel>
          <Input
            id="admin-current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="admin-new-password">New password</FieldLabel>
          <Input id="admin-new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="admin-confirm-password">Confirm new password</FieldLabel>
          <Input
            id="admin-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
      </div>
      <Button className="mt-4" onClick={save} disabled={!canSubmit || saving}>
        {saving ? "Saving…" : "Update password"}
      </Button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSetting[] | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);

  const load = useCallback(() => {
    adminSettingsApi.list().then(setSettings);
  }, []);

  useEffect(() => {
    load();
    getMe().then(setUser);
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-base text-muted-foreground">Platform wide configuration values.</p>
      </div>

      {user ? (
        <div className="space-y-6">
          <AdminProfileSection user={user} onSaved={setUser} />
          <AdminPasswordSection />
        </div>
      ) : (
        <Skeleton className="h-40 w-full rounded-2xl" />
      )}

      {!settings ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-5 rounded-2xl border border-hairline bg-surface p-6">
          {settings.map((setting) => (
            <SettingRow key={setting.key} setting={setting} onSaved={load} />
          ))}
        </div>
      )}
    </div>
  );
}
