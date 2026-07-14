const benefits = [
  {
    number: "01",
    title: "Full balance visibility",
    description:
      "Every wallet shows what is available versus locked in a trade, and a full transaction ledger accounts for every deposit, transfer, fee, and profit credit.",
  },
  {
    number: "02",
    title: "Live, direct pricing",
    description:
      "Crypto prices refresh continuously straight from CoinGecko, and once a trade is placed its capital is locked separately from your spendable balance until the cycle completes.",
  },
  {
    number: "03",
    title: "Security on your schedule",
    description:
      "Two factor login is available whenever you want it, and every deposit and withdrawal is admin reviewed for an added layer of account protection.",
  },
  {
    number: "04",
    title: "Rewards that pay automatically",
    description:
      "Referral rewards credit to your balance the moment someone you refer subscribes, no claim process or waiting on our end.",
  },
];

export function Benefits() {
  return (
    <section className="border-t border-hairline bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Why trade with us</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Why traders choose us</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            BYT Trading was built around one idea: you should always know exactly where your money is,
            whether that is available, locked in a trade, or in transit, with nothing hidden. No single
            opaque algorithm decides your outcome either. Every bot publishes its own target rate range
            and cycle length up front, so what you subscribe to is exactly what runs.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 divide-y divide-hairline border-t border-hairline sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex flex-col gap-3 py-8 sm:px-10">
              <span className="text-tabular text-4xl font-semibold text-primary [text-shadow:0_0_18px_rgba(20,184,166,0.65)]">
                {benefit.number}
              </span>
              <h3 className="text-xl font-semibold">{benefit.title}</h3>
              <p className="text-base text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
