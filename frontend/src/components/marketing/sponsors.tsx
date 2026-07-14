import {
  BinanceIcon,
  ChainalysisIcon,
  CircleIcon,
  CoinGeckoIcon,
  CoinbaseIcon,
  KrakenIcon,
  LedgerIcon,
  WalletConnectIcon,
} from "@/components/marketing/partner-logos";

const ecosystem = [
  { name: "Binance", icon: BinanceIcon, color: "#F0B90B" },
  { name: "Coinbase", icon: CoinbaseIcon, color: "#1652F0" },
  { name: "Circle", icon: CircleIcon, color: "#8C60F0" },
  { name: "CoinGecko", icon: CoinGeckoIcon, color: "#8DC63F" },
  { name: "Chainalysis", icon: ChainalysisIcon, color: "#1B2A4A" },
  { name: "Kraken", icon: KrakenIcon, color: "#5741D9" },
  { name: "Ledger", icon: LedgerIcon, color: "#000000" },
  { name: "WalletConnect", icon: WalletConnectIcon, color: "#3B99FC" },
];

export function Sponsors() {
  return (
    <section className="section-light section-light-hairline border-t">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="lg:col-span-5">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Part of a bigger network</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Built on the same rails as the wider crypto industry
            </h2>
            <p className="mt-6 max-w-md text-lg section-light-muted">
              BYT Trading does not operate in isolation. Pricing, custody, and market infrastructure all
              trace back to the networks and companies that the broader crypto ecosystem already relies
              on every day.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:col-span-7">
            {ecosystem.map((item) => (
              <div
                key={item.name}
                className="section-light-card section-light-hairline flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-transform hover:-translate-y-0.5"
              >
                <span
                  className="flex size-11 items-center justify-center rounded-xl"
                  style={{ color: item.color }}
                >
                  <item.icon className="size-7" />
                </span>
                <span className="text-sm font-medium section-light-muted">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
