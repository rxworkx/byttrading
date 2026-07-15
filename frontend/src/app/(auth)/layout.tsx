import { CheckCircle2, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { Logo } from "@/components/layout/logo";

const highlights = [
  {
    icon: TrendingUp,
    title: "Three fixed cycle bots",
    description: "AetherGuard, QuantumPulse, and TitanForge, each with a published target rate range.",
  },
  {
    icon: Wallet,
    title: "A full wallet ledger",
    description: "Every asset gets its own wallet, and every trade you place draws straight from the one you pick.",
  },
  {
    icon: ShieldCheck,
    title: "Security on your terms",
    description: "Email verification and two factor login are available, but never forced on you.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 md:px-20 lg:px-16 xl:px-24">
        <Logo size="lg" className="mb-10 lg:hidden" />
        <div className="w-full max-w-lg">{children}</div>
      </div>

      <div className="relative hidden overflow-hidden bg-surface lg:flex lg:flex-col lg:justify-center lg:gap-8 lg:p-16 xl:p-20">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(60% 50% at 20% 20%, rgba(20,184,166,0.22), transparent 60%), radial-gradient(50% 40% at 85% 80%, rgba(16,185,129,0.16), transparent 60%)",
          }}
        />
        <div className="relative">
          <p className="max-w-md text-3xl leading-snug font-semibold tracking-tight xl:text-4xl">
            Put your capital to work with bots that trade{" "}
            <span className="brand-gradient-text">while you sleep.</span>
          </p>
        </div>

        <div className="relative">
          <Logo size="lg" />
        </div>

        <div className="relative space-y-8">
          {highlights.map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl brand-gradient text-background">
                <item.icon className="size-6" />
              </span>
              <div>
                <p className="text-lg font-semibold">{item.title}</p>
                <p className="mt-1 text-base text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-primary" />
          Registered company, ABN verified and publicly checkable.
        </div>
      </div>
    </div>
  );
}
