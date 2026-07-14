import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const recap = [
  "3 fixed cycle trading bots",
  "Reviewed fund movements",
  "Two factor login, optional",
  "Live CoinGecko pricing",
];

export function JoinUs() {
  return (
    <section className="relative overflow-hidden border-t border-hairline bg-background">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(50% 60% at 10% 20%, rgba(20,184,166,0.25), transparent 60%), radial-gradient(45% 50% at 95% 90%, rgba(16,185,129,0.18), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="lg:col-span-7">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Get started</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to put your capital to work?
            </h2>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Create an account, deposit at your own pace, and subscribe to a bot whenever you are ready.
              No pressure to verify your email or turn on two factor login before you start.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                nativeButton={false}
                className="brand-gradient text-background hover:opacity-90"
                render={
                  <Link href="/signup">
                    Join BYT Trading <ArrowRight className="ml-1 size-4" />
                  </Link>
                }
              />
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/plans">View plans</Link>}
              />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-hairline bg-surface p-8 sm:p-10">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                What you are signing up for
              </p>
              <ul className="mt-6 flex flex-col gap-4">
                {recap.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 shrink-0 text-primary" />
                    <span className="text-base font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
