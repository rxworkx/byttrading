"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, type AdminUserDetail, type AdminUserReferrals } from "@/lib/admin-api";

function ReferralRow({ title, value }: { title: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <p className="text-sm font-medium">{title}</p>
      <div className="text-tabular text-sm text-muted-foreground">{value}</div>
    </div>
  );
}

function AdminUserReferralsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("userId") ?? "";
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [referrals, setReferrals] = useState<AdminUserReferrals | null>(null);

  const load = useCallback(() => {
    adminApi.userDetail(id).then(setDetail);
    adminApi.getUserReferrals(id).then(setReferrals);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const ready = detail && referrals;
  const activeDownlines = referrals?.downlines.filter((d) => d.status === "ACTIVE").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/users/funds?userId=${id}`}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to funds
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">
          {detail ? `${detail.user.firstName} ${detail.user.lastName}'s referrals` : "Referrals"}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">Upline and downline summary for this user.</p>
      </div>

      {!ready ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
          <ReferralRow title="Name" value={`${detail.user.firstName} ${detail.user.lastName}`} />
          <ReferralRow
            title="Upline"
            value={
              referrals.upline ? (
                <Link href={`/admin/users/detail?userId=${referrals.upline.id}`} className="text-primary hover:underline">
                  {referrals.upline.firstName} {referrals.upline.lastName}
                </Link>
              ) : (
                "No referrer"
              )
            }
          />
          <ReferralRow title="Downlines" value={referrals.downlines.length} />
          <ReferralRow title="Active downlines" value={activeDownlines} />
        </div>
      )}
    </div>
  );
}

export default function AdminUserReferralsPage() {
  return (
    <Suspense>
      <AdminUserReferralsContent />
    </Suspense>
  );
}
