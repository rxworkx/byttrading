"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { adminKycApi, type AdminKycRecord } from "@/lib/admin-api";
import { ApiError } from "@/lib/dashboard-api";
import { formatDateTime } from "@/lib/utils";

function KycRow({ record, onChanged }: { record: AdminKycRecord; onChanged: () => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function approve() {
    setSubmitting(true);
    try {
      await adminKycApi.approve(record.id);
      toast.success("KYC approved");
      onChanged();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not approve");
    } finally {
      setSubmitting(false);
    }
  }

  async function reject() {
    setSubmitting(true);
    try {
      await adminKycApi.reject(record.id, reason);
      toast.success("KYC rejected");
      onChanged();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not reject");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{record.documentType ?? "Unspecified document"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Submitted {record.submittedAt ? formatDateTime(record.submittedAt) : "unknown"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setRejecting((v) => !v)} disabled={submitting}>
            Reject
          </Button>
          <Button size="sm" className="brand-gradient text-background hover:opacity-90" onClick={approve} disabled={submitting}>
            Approve
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {record.documentFrontUrl ? (
          <a href={record.documentFrontUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Document front
          </a>
        ) : null}
        {record.documentBackUrl ? (
          <a href={record.documentBackUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Document back
          </a>
        ) : null}
        {record.selfieUrl ? (
          <a href={record.selfieUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Selfie
          </a>
        ) : null}
      </div>

      {rejecting ? (
        <div className="mt-4 space-y-2">
          <Textarea
            placeholder="Reason for rejection"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button size="sm" variant="destructive" onClick={reject} disabled={submitting || !reason}>
            Confirm rejection
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminKycPage() {
  const [records, setRecords] = useState<AdminKycRecord[] | null>(null);

  const load = useCallback(() => {
    adminKycApi.pending().then(setRecords);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">KYC queue</h1>
        <p className="mt-1 text-base text-muted-foreground">Review and approve pending identity verifications.</p>
      </div>

      {!records ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-8 text-center">
          <ShieldCheck className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No pending KYC submissions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <KycRow key={record.id} record={record} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
