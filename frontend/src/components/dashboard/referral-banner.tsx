import Link from "next/link";
import { Users } from "lucide-react";

export function ReferralBanner() {
  return (
    <Link
      href="/referral"
      className="flex items-center justify-between rounded-2xl border border-hairline bg-surface p-5 transition-colors hover:bg-surface-raised"
    >
      <div>
        <p className="font-semibold">Refer and earn now!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Rewards get added to your balance automatically.
        </p>
      </div>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
        <Users className="size-5 text-primary" />
      </span>
    </Link>
  );
}
