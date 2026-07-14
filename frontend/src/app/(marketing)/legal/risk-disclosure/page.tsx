import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Risk Disclosure | BYT Trading" };

export default function RiskDisclosurePage() {
  return (
    <LegalPage title="Risk Disclosure" updated="January 2025">
      <p>
        Trading digital assets carries significant risk. Please read this disclosure carefully before
        subscribing to any bot or starting a trade cycle.
      </p>

      <h2>1. Market volatility</h2>
      <p>
        Cryptocurrency prices are highly volatile and can move sharply in short periods. The USD value of
        your wallet balances will fluctuate with live market prices.
      </p>

      <h2>2. Custody and counterparty risk</h2>
      <p>
        Assets you deposit are held as part of BYT Trading&apos;s wallet infrastructure rather than in a
        separate account you control directly. This means you are relying on us, and on any third party
        infrastructure or liquidity providers we in turn depend on, to safeguard and move your funds
        correctly. Should any of these parties fail to perform as expected, your access to funds could be
        delayed or affected.
      </p>

      <h2>3. Locked funds during a trade cycle</h2>
      <p>
        Once you start a trade, your principal and any accrued profit are locked until that cycle&apos;s
        scheduled completion date. You will not be able to withdraw or reallocate locked funds before the
        cycle ends.
      </p>

      <h2>4. Platform &amp; operational risk</h2>
      <p>
        As with any software platform, technical issues, third party service interruptions (including
        price data providers), or delays in manual review of deposits and withdrawals may affect the
        timing of fund availability.
      </p>

      <h2>5. Not financial advice</h2>
      <p>
        Nothing on this platform constitutes financial, investment, or legal advice. You should consider
        your own financial situation and risk tolerance, and consult an independent professional adviser,
        before using BYT Trading.
      </p>

      <h2>6. Your acknowledgment</h2>
      <p>
        By subscribing to a bot or starting a trade cycle, you acknowledge that you understand and accept
        the risks described in this disclosure.
      </p>
    </LegalPage>
  );
}
