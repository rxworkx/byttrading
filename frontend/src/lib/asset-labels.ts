export const ASSET_LABELS: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  tether: "USDT",
  "usd-coin": "USDC",
  binancecoin: "BNB",
  solana: "SOL",
  ripple: "XRP",
  dogecoin: "DOGE",
};

// Wallet symbol -> icon filename under /public/images/tokens. Keep in sync with
// backend/src/database/asset-catalog.ts.
export const ASSET_ICONS: Record<string, string> = {
  fiat_usd: "usd.svg",
  BTC: "btc.png",
  ETH: "eth.png",
  USDT: "usdt.png",
  USDC: "usdc.png",
  BNB: "bnb.png",
  XRP: "xrp.png",
  SOL: "sol.png",
  TRX: "trx.png",
  MATIC: "matic.png",
  WETH: "weth.png",
  LINK: "link.png",
  AVAX: "avax.png",
  AAVE: "aave.png",
  DOGE: "doge.png",
  ADA: "ada.png",
  XLM: "xlm.png",
  LTC: "ltc.png",
  BCH: "bch.png",
  ALGO: "algo.png",
  XTZ: "xtz.png",
  ARBITRUM: "arbitrum.png",
  ATOM: "atom.png",
  DASH: "dash.png",
  KAVA: "kava.png",
  EOS: "eos.png",
  XMR: "xmr.png",
  SUI: "sui.png",
  TERRA: "terra.png",
  FDUSD: "fdusd.png",
  TRUMP: "trump.png",
  RED: "red.png",
};

export function assetIconSrc(symbol: string) {
  const file = ASSET_ICONS[symbol] ?? ASSET_ICONS[symbol.toUpperCase()];
  return file ? `/images/tokens/${file}` : null;
}

// Fiat reads better at the bottom of a crypto-first wallet list, so this keeps
// catalog order for everything else and pushes fiat_usd to the end.
export function sortWalletsFiatLast<T extends { symbol: string }>(wallets: T[]): T[] {
  return [...wallets].sort((a, b) => {
    const aFiat = a.symbol === "fiat_usd" ? 1 : 0;
    const bFiat = b.symbol === "fiat_usd" ? 1 : 0;
    return aFiat - bFiat;
  });
}

// Whatever a user actually holds a balance in is what they can realistically
// transact with, so those wallets lead regardless of catalog position.
// fiat_usd still always anchors to the very bottom, funded or not.
export function sortWalletsByBalance<T extends { symbol: string; balance: string }>(wallets: T[]): T[] {
  return [...wallets].sort((a, b) => {
    const aFiat = a.symbol === "fiat_usd" ? 1 : 0;
    const bFiat = b.symbol === "fiat_usd" ? 1 : 0;
    if (aFiat !== bFiat) return aFiat - bFiat;
    const aHasBalance = Number(a.balance) > 0 ? 0 : 1;
    const bHasBalance = Number(b.balance) > 0 ? 0 : 1;
    return aHasBalance - bHasBalance;
  });
}

// The wallet symbol "fiat_usd" is an internal identifier, not a real
// currency code, so it always displays as USD.
export function currencyLabel(symbol: string) {
  return symbol === "fiat_usd" ? "USD" : symbol.toUpperCase();
}
