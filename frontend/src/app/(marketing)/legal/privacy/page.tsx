import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Privacy Policy | BYT Trading" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="January 2025">
      <p>
        This Privacy Policy explains how BYT Trading collects, uses, and protects your personal
        information when you use our platform.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>Account details: name, email, phone, country.</li>
        <li>Verification information: KYC documents where submitted.</li>
        <li>Transaction data: deposits, withdrawals, transfers, subscriptions, and trade activity.</li>
        <li>Technical data: IP address and device/browser information used for security purposes.</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To create and secure your account, including email verification and 2FA.</li>
        <li>To process deposits, withdrawals, and trade cycles.</li>
        <li>To detect and prevent fraud or unauthorized account access.</li>
        <li>To comply with applicable legal and regulatory obligations.</li>
      </ul>

      <h2>3. Data retention</h2>
      <p>
        We retain account and transaction records for as long as your account is active and for a
        reasonable period afterward to meet legal, accounting, and fraud prevention obligations.
      </p>

      <h2>4. Data sharing</h2>
      <p>
        We do not sell your personal information. We may share data with service providers who support
        platform operations (e.g., email delivery) under confidentiality obligations, or where required
        by law.
      </p>

      <h2>5. Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal information, subject to
        our legal and record keeping obligations, by contacting {siteConfig.supportEmail}.
      </p>

      <h2>6. Security</h2>
      <p>
        Passwords are hashed and never stored in plain text. Sessions are secured with httpOnly cookies,
        and login can optionally be protected with email based two factor authentication.
      </p>

      <h2>7. Changes to this policy</h2>
      <p>We may update this Privacy Policy periodically. Material changes will be reflected on this page.</p>
    </LegalPage>
  );
}
