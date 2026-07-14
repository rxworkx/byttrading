"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { kycApi, ApiError, type KycRecord } from "@/lib/dashboard-api";

const kycBadge: Record<KycRecord["status"], { label: string; className: string }> = {
  NOT_SUBMITTED: { label: "Not submitted", className: "bg-secondary text-foreground" },
  PENDING: { label: "Pending review", className: "bg-status-warning/15 text-status-warning" },
  APPROVED: { label: "Approved", className: "bg-status-good/15 text-status-good" },
  REJECTED: { label: "Rejected", className: "bg-destructive/15 text-destructive" },
};

const documentTypeLabels: Record<string, string> = {
  passport: "Passport",
  drivers_license: "Driver's license",
  national_id: "National ID",
};

export default function KycPage() {
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [documentType, setDocumentType] = useState("passport");
  const [documentFrontUrl, setDocumentFrontUrl] = useState("");
  const [documentBackUrl, setDocumentBackUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    kycApi.mine().then(setKyc);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await kycApi.submit({
        documentType,
        documentFrontUrl,
        documentBackUrl: documentBackUrl || undefined,
        selfieUrl: selfieUrl || undefined,
      });
      setKyc(result);
      toast.success("KYC submitted for review");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!kyc) return <Skeleton className="h-64 w-full rounded-2xl" />;

  const canSubmit = kyc.status !== "APPROVED" && kyc.status !== "PENDING";

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">KYC Verification</h1>
        <Badge className={`border-0 ${kycBadge[kyc.status].className}`}>{kycBadge[kyc.status].label}</Badge>
      </div>

      {kyc.status === "REJECTED" && kyc.rejectionReason ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {kyc.rejectionReason}
        </p>
      ) : null}

      {canSubmit ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>Document type</FieldLabel>
            <Select value={documentType} onValueChange={(v) => v && setDocumentType(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>{documentTypeLabels[documentType]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="drivers_license">Driver&apos;s license</SelectItem>
                <SelectItem value="national_id">National ID</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="front">Document front (link)</FieldLabel>
            <Input id="front" value={documentFrontUrl} onChange={(e) => setDocumentFrontUrl(e.target.value)} required />
            <FieldDescription>Upload your document to any file host and paste the link.</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="back">Document back (link, optional)</FieldLabel>
            <Input id="back" value={documentBackUrl} onChange={(e) => setDocumentBackUrl(e.target.value)} />
          </Field>

          <Field>
            <FieldLabel htmlFor="selfie">Selfie holding the document (link, optional)</FieldLabel>
            <Input id="selfie" value={selfieUrl} onChange={(e) => setSelfieUrl(e.target.value)} />
          </Field>

          <Button
            type="submit"
            disabled={submitting || !documentFrontUrl}
            className="w-full brand-gradient text-background hover:opacity-90"
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          {kyc.status === "PENDING"
            ? "Your submission is being reviewed. We'll notify you once it's processed."
            : "Your identity has been verified."}
        </p>
      )}
    </div>
  );
}
