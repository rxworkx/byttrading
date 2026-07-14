import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Terms of Use | BYT Trading" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="January 2025">
      <p>
        These Terms of Use (&quot;Terms&quot;) govern your access to and use of the BYT Trading platform,
        operated under ABN {siteConfig.abn} (&quot;BYT Trading&quot;, &quot;we&quot;, &quot;us&quot;). By
        creating an account, you agree to be bound by these Terms.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old and legally capable of entering a binding agreement in your
        jurisdiction to use the platform. You are responsible for ensuring your use of BYT Trading
        complies with local laws.
      </p>

      <h2>2. Account registration &amp; security</h2>
      <ul>
        <li>You must provide accurate information when creating an account.</li>
        <li>You are responsible for maintaining the confidentiality of your password and 2FA codes.</li>
        <li>You must notify us immediately of any unauthorized use of your account.</li>
      </ul>

      <h2>3. Wallets, deposits &amp; withdrawals</h2>
      <p>
        Deposits are credited to your wallet only after review and confirmation. Withdrawal requests may
        be subject to admin approval, minimum amounts, and KYC verification before funds are released.
      </p>

      <h2>4. Subscriptions &amp; trade cycles</h2>
      <p>
        Subscribing to a bot grants access to start trade cycles with that bot for the duration of your
        subscription term. Once a trade cycle begins, the principal and any accrued profit are locked
        until the cycle&apos;s scheduled completion date. Rates applied within a cycle fall within the
        published range for that bot but are not guaranteed.
      </p>

      <h2>5. Prohibited conduct</h2>
      <ul>
        <li>Attempting to circumvent security controls or access another user&apos;s account.</li>
        <li>Using the platform for money laundering or any unlawful purpose.</li>
        <li>Submitting false deposit, withdrawal, or KYC information.</li>
      </ul>

      <h2>6. Termination</h2>
      <p>
        We may suspend or terminate accounts that violate these Terms, subject to applicable law. On
        termination, available balances that are not locked in a trade remain withdrawable subject to
        standard review.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, BYT Trading is not liable for indirect, incidental, or
        consequential losses arising from your use of the platform, including losses from market
        volatility. See our{" "}
        <a href="/legal/risk-disclosure" className="text-primary hover:underline">
          Risk Disclosure
        </a>{" "}
        for details.
      </p>

      <h2>8. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the platform after changes take
        effect constitutes acceptance of the revised Terms.
      </p>

      <h2>9. Contact</h2>
      <p>Questions about these Terms can be sent to {siteConfig.supportEmail}.</p>
    </LegalPage>
  );
}
