import { cn } from "@/lib/utils";

const steps = [
  {
    step: "01",
    title: "Create your account",
    description:
      "Sign up with your email and password in under a minute. Email verification and two factor login are available whenever you want them, but neither is required to get moving.",
  },
  {
    step: "02",
    title: "Deposit into your wallet",
    description:
      "Send crypto to your personal deposit address, or buy crypto directly through our on ramp partner if you are starting from scratch. Once confirmed, it lands in your wallet balance.",
  },
  {
    step: "03",
    title: "Subscribe to a bot",
    description:
      "Choose AetherGuard, QuantumPulse, or TitanForge based on the risk profile that suits you, then pick a 6 month or 1 year subscription term.",
  },
  {
    step: "04",
    title: "Place a trade",
    description:
      "Pick the subscribed bot you want to activate, choose which wallet to fund it from, and set the amount to trade. That amount is debited immediately and locked, together with any profit, for the fixed length of that bot's cycle.",
  },
  {
    step: "05",
    title: "Withdraw your returns",
    description:
      "When the cycle ends, principal plus profit unlock back into that same wallet automatically, ready to withdraw or roll into another cycle.",
  },
];

const rows = [steps.slice(0, 3), steps.slice(3, 5)];

const glow = "bg-gradient-to-b from-hairline via-primary to-hairline shadow-[0_0_14px_2px_rgba(20,184,166,0.55)]";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-hairline bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">The process</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From your first deposit to your first withdrawal, every step of the cycle stays visible in
            your dashboard so you always know exactly where your money sits.
          </p>
        </div>

        <div className="mt-20 flex flex-col">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex}>
              {rowIndex > 0 ? (
                <div className="mx-auto h-10 w-px sm:h-14">
                  <div className={cn("mx-auto h-full w-px", glow)} />
                </div>
              ) : null}

              <div className="relative">
                <div className="absolute top-5 right-[16.6667%] left-[16.6667%] hidden h-px -translate-y-1/2 bg-gradient-to-r from-hairline via-primary to-hairline shadow-[0_0_14px_2px_rgba(20,184,166,0.55)] sm:block" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {row.map((item) => (
                    <div key={item.step} className="flex flex-col items-center sm:items-stretch">
                      <span className="relative z-10 size-3 self-center rounded-full bg-primary shadow-[0_0_10px_2px_rgba(20,184,166,0.6)]" />
                      <div className={cn("mx-auto h-4 w-px", glow)} />
                      <div className="rounded-2xl border border-hairline bg-surface p-6 text-center sm:text-left">
                        <span className="text-tabular text-sm font-semibold text-primary">{item.step}</span>
                        <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                        <p className="mt-2 text-base text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
