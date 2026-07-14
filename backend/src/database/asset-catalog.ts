import type { Repository } from 'typeorm';
import type { Asset } from './entities/asset.entity';

export interface AssetDefinition {
  symbol: string;
  name: string;
  apiId: string | null;
  isFiat: boolean;
  fixedRateUsd: string | null;
  image: string;
}

// The static seed list for the `assets` table (see ensureAssetCatalogSeeded
// below). fiat_usd is pegged to 1 and never goes through the CoinGecko
// price-refresh job. Images live in frontend/public/images/tokens.
// Subscribing to a bot and placing a trade both debit whichever wallet the
// user picks directly, there is no separate trading wallet.
export const ASSET_CATALOG: AssetDefinition[] = [
  {
    symbol: 'fiat_usd',
    name: 'Fiat Usd',
    apiId: null,
    isFiat: true,
    fixedRateUsd: '1',
    image: 'usd.svg',
  },
  { symbol: 'BTC', name: 'Bitcoin', apiId: 'bitcoin', isFiat: false, fixedRateUsd: null, image: 'btc.png' },
  { symbol: 'ETH', name: 'Ethereum', apiId: 'ethereum', isFiat: false, fixedRateUsd: null, image: 'eth.png' },
  { symbol: 'USDT', name: 'Tether', apiId: 'tether', isFiat: false, fixedRateUsd: null, image: 'usdt.png' },
  { symbol: 'USDC', name: 'USD Coin', apiId: 'usd-coin', isFiat: false, fixedRateUsd: null, image: 'usdc.png' },
  { symbol: 'BNB', name: 'BNB', apiId: 'binancecoin', isFiat: false, fixedRateUsd: null, image: 'bnb.png' },
  { symbol: 'XRP', name: 'XRP', apiId: 'ripple', isFiat: false, fixedRateUsd: null, image: 'xrp.png' },
  { symbol: 'SOL', name: 'Solana', apiId: 'solana', isFiat: false, fixedRateUsd: null, image: 'sol.png' },
  { symbol: 'TRX', name: 'TRON', apiId: 'tron', isFiat: false, fixedRateUsd: null, image: 'trx.png' },
  { symbol: 'MATIC', name: 'Polygon', apiId: 'matic-network', isFiat: false, fixedRateUsd: null, image: 'matic.png' },
  { symbol: 'WETH', name: 'Wrapped Ether', apiId: 'weth', isFiat: false, fixedRateUsd: null, image: 'weth.png' },
  { symbol: 'LINK', name: 'Chainlink', apiId: 'chainlink', isFiat: false, fixedRateUsd: null, image: 'link.png' },
  { symbol: 'AVAX', name: 'Avalanche', apiId: 'avalanche-2', isFiat: false, fixedRateUsd: null, image: 'avax.png' },
  { symbol: 'AAVE', name: 'Aave', apiId: 'aave', isFiat: false, fixedRateUsd: null, image: 'aave.png' },
  { symbol: 'DOGE', name: 'Dogecoin', apiId: 'dogecoin', isFiat: false, fixedRateUsd: null, image: 'doge.png' },
  { symbol: 'ADA', name: 'Cardano', apiId: 'cardano', isFiat: false, fixedRateUsd: null, image: 'ada.png' },
  { symbol: 'XLM', name: 'Stellar', apiId: 'stellar', isFiat: false, fixedRateUsd: null, image: 'xlm.png' },
  { symbol: 'LTC', name: 'Litecoin', apiId: 'litecoin', isFiat: false, fixedRateUsd: null, image: 'ltc.png' },
  { symbol: 'BCH', name: 'Bitcoin Cash', apiId: 'bitcoin-cash', isFiat: false, fixedRateUsd: null, image: 'bch.png' },
  { symbol: 'ALGO', name: 'Algorand', apiId: 'algorand', isFiat: false, fixedRateUsd: null, image: 'algo.png' },
  { symbol: 'XTZ', name: 'Tezos', apiId: 'tezos', isFiat: false, fixedRateUsd: null, image: 'xtz.png' },
  { symbol: 'ARBITRUM', name: 'Arbitrum', apiId: 'arbitrum', isFiat: false, fixedRateUsd: null, image: 'arbitrum.png' },
  { symbol: 'ATOM', name: 'Cosmos', apiId: 'cosmos', isFiat: false, fixedRateUsd: null, image: 'atom.png' },
  { symbol: 'DASH', name: 'Dash', apiId: 'dash', isFiat: false, fixedRateUsd: null, image: 'dash.png' },
  { symbol: 'KAVA', name: 'Kava', apiId: 'kava', isFiat: false, fixedRateUsd: null, image: 'kava.png' },
  { symbol: 'EOS', name: 'Eos', apiId: 'eos', isFiat: false, fixedRateUsd: null, image: 'eos.png' },
  { symbol: 'XMR', name: 'Monero', apiId: 'monero', isFiat: false, fixedRateUsd: null, image: 'xmr.png' },
  { symbol: 'SUI', name: 'Sui', apiId: 'sui', isFiat: false, fixedRateUsd: null, image: 'sui.png' },
  { symbol: 'TERRA', name: 'Terra', apiId: 'terra-luna-2', isFiat: false, fixedRateUsd: null, image: 'terra.png' },
  { symbol: 'FDUSD', name: 'First Digital USD', apiId: 'first-digital-usd', isFiat: false, fixedRateUsd: null, image: 'fdusd.png' },
  { symbol: 'TRUMP', name: 'Official Trump', apiId: 'official-trump', isFiat: false, fixedRateUsd: null, image: 'trump.png' },
  { symbol: 'RED', name: 'RED Token', apiId: 'red-token', isFiat: false, fixedRateUsd: null, image: 'red.png' },
];

// Inserts any catalog entries missing from the `assets` table, seeding
// sortOrder from array position (so BTC/ETH/USDT rank just after fiat_usd)
// and enabled/showInWalletList defaulted on. Never touches existing rows, so
// admin edits (enabled, sort, showInWalletList, price) survive redeploys.
// Called on every real app boot (PricesService.onModuleInit) and from the
// standalone seed script, since neither can assume the table is populated.
export async function ensureAssetCatalogSeeded(
  assetRepo: Repository<Asset>,
): Promise<void> {
  const existing = await assetRepo.find({ select: { symbol: true } });
  const existingSymbols = new Set(existing.map((asset) => asset.symbol));
  const missing = ASSET_CATALOG.filter(
    (asset) => !existingSymbols.has(asset.symbol),
  );
  if (missing.length === 0) return;

  await assetRepo.insert(
    missing.map((asset) => ({
      symbol: asset.symbol,
      name: asset.name,
      apiId: asset.apiId,
      image: asset.image,
      isFiat: asset.isFiat,
      fixedRateUsd: asset.fixedRateUsd,
      sortOrder: ASSET_CATALOG.indexOf(asset),
    })),
  );
}
