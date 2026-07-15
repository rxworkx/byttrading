import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const KEEP_ALIVE_INTERVAL_MS = 20_000;
// Must match (or exceed) database.module.ts's pool `max`, otherwise a single
// sequential ping only ever touches one connection and the rest of the pool
// goes stale between real requests, silently dropped by the Supabase pooler.
const POOL_SIZE = 5;

// Pings every connection in the pool concurrently on a fixed interval so the
// Supabase connection pooler never sees any of them go idle long enough to
// drop it. A single sequential ping only warms whichever connection the pool
// happens to hand out for that one call, the other 9 still go stale, which
// is why queries were still paying a multi-second reconnect cost even with
// this service running.
@Injectable()
export class DatabaseKeepAliveService {
  private readonly logger = new Logger(DatabaseKeepAliveService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Interval(KEEP_ALIVE_INTERVAL_MS)
  async ping() {
    const results = await Promise.allSettled(
      Array.from({ length: POOL_SIZE }, () => this.dataSource.query('SELECT 1')),
    );
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      this.logger.warn(
        `Database keep-alive: ${failures.length}/${POOL_SIZE} pings failed`,
      );
    }
  }
}
