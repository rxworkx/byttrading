import Link from "next/link";
import { FileText, ShieldCheck, ExternalLink } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

const measures = [
  "Argon2 password hashing",
  "Encrypted in transit",
  "Encrypted at rest",
  "Two factor login, optional",
  "Withdrawals reviewed",
  "Short lived session tokens",
];

export function SecurityTrust() {
  return (
    <section className="section-light section-light-hairline border-t">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-7">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Security and trust</p>
            <h2 className="mt-3 -ml-1 max-w-lg -rotate-1 text-4xl font-bold tracking-tight sm:text-5xl">
              Built to be checked, not just trusted
            </h2>

            <p className="mt-8 text-xl font-medium leading-snug tracking-tight sm:text-2xl">
              Every password is <span className="text-primary">hashed with Argon2</span>. Every
              connection to your account is <span className="text-primary">encrypted in transit</span>,
              and your data is <span className="text-primary">encrypted at rest</span>. Two factor login
              is <span className="text-primary">available whenever you want it</span>, never forced on
              you. Every withdrawal is <span className="text-primary">reviewed before it settles</span>.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {measures.map((item) => (
                <span
                  key={item}
                  className="rounded-sm border border-primary/40 bg-white px-5 py-3 text-sm font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-background p-8 text-white sm:p-10">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <ShieldCheck className="size-6" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">Registered company</h3>
              <p className="mt-3 text-base text-white/80">
                BYT Trading operates under a verified Australian Business Number. Check it independently
                any time, or read our company overview for a plain summary of what we do.
              </p>
              <dl className="mt-6 border-t border-white/10 pt-6">
                <dt className="text-xs text-white/60">Company registration (ABN)</dt>
                <dd className="text-tabular mt-1 text-lg font-semibold">{siteConfig.abn}</dd>
              </dl>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={siteConfig.abnUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-base font-medium hover:bg-white/5"
                >
                  Verify ABN <ExternalLink className="size-4" />
                </Link>
                <Link
                  href="/documents/byt-trading-company-overview.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg brand-gradient px-5 py-3 text-base font-medium text-background hover:opacity-90"
                >
                  Company overview (PDF) <FileText className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
