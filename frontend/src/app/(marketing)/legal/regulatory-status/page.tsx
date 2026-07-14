import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Regulatory Status | BYT Trading" };

export default function RegulatoryStatusPage() {
  return (
    <LegalPage title="Regulatory Status" updated="January 2025">
      <p>
        BYT Trading is registered as a company in Australia under ABN {siteConfig.abn}. You can verify
        this registration directly with the Australian Business Register from our{" "}
        <a href="/legal/company-registration" className="text-primary hover:underline">
          Company Registration
        </a>{" "}
        page.
      </p>

      <h2>1. What this registration covers</h2>
      <p>
        Company (ABN) registration confirms that BYT Trading is a legally registered business entity in
        Australia. It speaks to our existence as a company, not to the performance, safety, or suitability
        of any trading bot subscription.
      </p>

      <h2>2. Independent verification</h2>
      <p>
        The Australian Business Register lookup is public and free, so you can check our registration
        directly in a few seconds from our{" "}
        <a href="/legal/company-registration" className="text-primary hover:underline">
          Company Registration
        </a>{" "}
        page, any time you like.
      </p>

      <h2>3. Your responsibility</h2>
      <p>
        It is your responsibility to determine whether use of BYT Trading is permitted under the laws of
        your jurisdiction, and whether any local licensing, registration, or tax obligations apply to you
        as a user.
      </p>

      <h2>4. Updates to this page</h2>
      <p>
        We review this page from time to time to keep it accurate. If anything material changes about how
        BYT Trading operates or is structured, this page will be updated to reflect that, along with a
        revised date at the top.
      </p>
    </LegalPage>
  );
}
