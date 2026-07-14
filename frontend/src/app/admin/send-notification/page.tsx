"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPicker } from "@/components/admin/user-picker";
import {
  adminApi,
  adminNotificationsApi,
  adminNotificationLogApi,
  type AdminUser,
  type AdminNotificationLog,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/dashboard-api";
import { formatDateTime, formatLabel } from "@/lib/utils";
import { useRowSelection } from "@/lib/use-row-selection";

const TYPES = ["INFO", "SUCCESS", "WARNING", "TRANSACTION", "INVESTMENT", "REFERRAL", "KYC"];

function SendNotificationContent() {
  const searchParams = useSearchParams();
  const presetUserId = searchParams.get("userId") ?? "";
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [broadcast, setBroadcast] = useState(false);
  const [userId, setUserId] = useState(presetUserId);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("INFO");
  const [sendEmail, setSendEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [log, setLog] = useState<AdminNotificationLog[] | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { selectedIds, toggleOne, toggleAll, isAllSelected, clear } = useRowSelection(
    log?.map((entry) => entry.id) ?? [],
  );

  const loadLog = useCallback(() => {
    adminNotificationLogApi.list().then(setLog);
  }, []);

  useEffect(() => {
    adminApi.users().then(setUsers);
    loadLog();
  }, [loadLog]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !body || (!broadcast && !userId)) return;
    setSubmitting(true);
    try {
      await adminNotificationsApi.send({
        userId: broadcast ? undefined : userId,
        title,
        body,
        type,
        sendEmail,
      });
      toast.success(broadcast ? "Notification sent to everyone" : "Notification sent");
      setTitle("");
      setBody("");
      loadLog();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not send notification");
    } finally {
      setSubmitting(false);
    }
  }

  async function bulkDelete() {
    const ids = Array.from(selectedIds);
    setConfirmDeleteOpen(false);
    const results = await Promise.allSettled(ids.map((id) => adminNotificationLogApi.delete(id)));
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;
    if (succeeded > 0) toast.success(`Deleted ${succeeded} log entr${succeeded === 1 ? "y" : "ies"}`);
    if (failed > 0) toast.error(`${failed} could not be deleted`);
    clear();
    loadLog();
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Send notification</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Send a notification to one user, or broadcast it to everyone.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-hairline bg-surface p-6">
          <Field orientation="horizontal">
            <FieldLabel htmlFor="broadcast">Send to everyone</FieldLabel>
            <Switch id="broadcast" checked={broadcast} onCheckedChange={(checked) => setBroadcast(checked === true)} />
          </Field>

          {!broadcast ? (
            <Field>
              <FieldLabel>User</FieldLabel>
              <UserPicker users={users} value={userId} onChange={setUserId} />
            </Field>
          ) : null}

          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select value={type} onValueChange={(v) => v && setType(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>{formatLabel(type)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {formatLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>

          <Field>
            <FieldLabel htmlFor="body">Message</FieldLabel>
            <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} required />
            <FieldDescription>Shows up in the recipient&apos;s notification bell and history.</FieldDescription>
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="send-email">Also send as email</FieldLabel>
            <Switch id="send-email" checked={sendEmail} onCheckedChange={(checked) => setSendEmail(checked === true)} />
          </Field>

          <Button
            type="submit"
            disabled={submitting || !title || !body || (!broadcast && !userId)}
            className="w-full"
          >
            {submitting ? "Sending…" : broadcast ? "Send to everyone" : "Send"}
          </Button>
        </form>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">Sent notifications</h2>

        {!log ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : log.length === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-8 text-center">
            <Bell className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nothing sent yet.</p>
          </div>
        ) : (
          <>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-hairline bg-surface">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {log.map((entry) => (
                    <TableRow key={entry.id} data-state={selectedIds.has(entry.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox checked={selectedIds.has(entry.id)} onCheckedChange={() => toggleOne(entry.id)} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.recipientLabel}
                        {entry.recipientCount > 1 ? (
                          <span className="ml-1 text-xs text-muted-foreground">({entry.recipientCount})</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatLabel(entry.type)}</TableCell>
                      <TableCell>
                        <p className="font-medium">{entry.title}</p>
                        <p className="max-w-xs truncate text-xs text-muted-foreground">{entry.body}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{entry.sentEmail ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(entry.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {selectedIds.size > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-hairline bg-surface p-4">
                <span className="mr-1 text-sm font-medium">{selectedIds.size} selected</span>
                <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                  <AlertDialogTrigger render={<Button size="sm" variant="destructive">Delete</Button>} />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete {selectedIds.size} log entr{selectedIds.size === 1 ? "y" : "ies"}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This only removes the audit log entry. It does not unsend the notification or remove it
                        from any recipient&apos;s notification bell.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={bulkDelete}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminSendNotificationPage() {
  return (
    <Suspense>
      <SendNotificationContent />
    </Suspense>
  );
}
