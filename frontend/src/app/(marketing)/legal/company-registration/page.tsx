import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Company Registration | BYT Trading" };

export default function CompanyRegistrationPage() {
  return (
    <LegalPage title="Company Registration" updated="January 2025">
      <p>BYT Trading&apos;s company registration details are below. You can verify these independently on the Australian Business Register.</p>

      <dl className="grid grid-cols-1 gap-4 rounded-2xl border border-hairline bg-surface p-6 not-prose sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Legal name</dt>
          <dd className="mt-1 font-medium text-foreground">BYT Trading Pty Ltd</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Australian Business Number (ABN)</dt>
          <dd className="text-tabular mt-1 font-medium text-foreground">{siteConfig.abn}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Registered address</dt>
          <dd className="mt-1 font-medium text-foreground">{siteConfig.address}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Verification</dt>
          <dd className="mt-1">
            <Link
              href={siteConfig.abnUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              View on the Australian Business Register <ExternalLink className="size-3.5" />
            </Link>
          </dd>
        </div>
      </dl>

      <p>
        For a summary of what our business does, see our{" "}
        <a href="/documents/byt-trading-company-overview.pdf" target="_blank" rel="noreferrer" className="text-primary hover:underline">
          company overview document
        </a>
        .
      </p>
    </LegalPage>
  );
}
