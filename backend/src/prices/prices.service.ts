import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../database/entities';
import { ensureAssetCatalogSeeded } from '../database/asset-catalog';

interface CachedPrice {
  usdPrice: number;
  priceChange: number | null;
  fetchedAt: Date;
}

const REFRESH_INTERVAL_MS = 90_000;

@Injectable()
export class PricesService implements OnModuleInit {
  private readonly logger = new Logger(PricesService.name);
  private readonly memoryCache = new Map<string, CachedPrice>();

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await ensureAssetCatalogSeeded(this.assetRepo);

    const rows = await this.assetRepo.find();
    for (const row of rows) {
      if (!row.apiId || row.price == null || row.fetchedAt == null) continue;
      this.memoryCache.set(row.apiId, {
        usdPrice: Number(row.price),
        priceChange: row.priceChange == null ? null : Number(row.priceChange),
        fetchedAt: row.fetchedAt,
      });
    }
    await this.refreshPrices();
  }

  @Interval(REFRESH_INTERVAL_MS)
  async refreshPrices(force = false) {
    const trackedAssets = await this.assetRepo.find({
      where: { enabled: true },
    });
    const tracked = trackedAssets.filter(
      (asset): asset is Asset & { apiId: string } => !!asset.apiId,
    );
    if (tracked.length === 0) return;

    // fetchedAt gates the actual CoinGecko call so a forced refresh (or an
    // overlapping tick) doesn't hammer the API: only fetch if the freshest
    // known price is already outside the refresh window.
    if (!force) {
      const freshestFetchedAt = tracked.reduce<Date | null>((freshest, asset) => {
        if (!asset.fetchedAt) return freshest;
        if (!freshest || asset.fetchedAt > freshest) return asset.fetchedAt;
        return freshest;
      }, null);
      const isStale =
        !freshestFetchedAt ||
        Date.now() - freshestFetchedAt.getTime() >= REFRESH_INTERVAL_MS;
      if (!isStale) return;
    }

    const apiIds = tracked.map((asset) => asset.apiId);
    const base = this.config.get<string>('COINGECKO_API_BASE');
    const url = `${base}/simple/price?ids=${apiIds.join(',')}&vs_currencies=usd&include_24hr_change=true`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);
      const data = (await res.json()) as Record<
        string,
        { usd?: number; usd_24h_change?: number }
      >;

      const fetchedAt = new Date();
      for (const asset of tracked) {
        const usd = data[asset.apiId]?.usd;
        if (usd == null) continue;
        const change = data[asset.apiId]?.usd_24h_change ?? null;

        this.memoryCache.set(asset.apiId, {
          usdPrice: usd,
          priceChange: change,
          fetchedAt,
        });
        await this.assetRepo.update(
          { apiId: asset.apiId },
          {
            price: String(usd),
            priceChange: change == null ? null : change.toFixed(4),
            fetchedAt,
          },
        );
      }
      this.logger.debug(`Refreshed prices for ${tracked.length} assets`);
    } catch (error) {
      this.logger.warn(
        `Price refresh failed, serving last-known-good: ${(error as Error).message}`,
      );
    }
  }

  getPrice(apiId: string): number | null {
    return this.memoryCache.get(apiId)?.usdPrice ?? null;
  }

  getAllCached(): Record<
    string,
    { usdPrice: number; priceChange: number | null; fetchedAt: Date }
  > {
    const result: Record<
      string,
      { usdPrice: number; priceChange: number | null; fetchedAt: Date }
    > = {};
    for (const [apiId, value] of this.memoryCache.entries()) {
      result[apiId] = value;
    }
    return result;
  }

  async forceRefresh() {
    await this.refreshPrices(true);
    return this.getAllCached();
  }
}
