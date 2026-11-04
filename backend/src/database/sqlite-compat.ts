import { AsyncLocalStorage } from 'async_hooks';
import { mkdirSync } from 'fs';
import { dirname, isAbsolute } from 'path';
import Decimal from 'decimal.js';
import {
  DataSource,
  DataSourceOptions,
  EntityManager,
  getMetadataArgsStorage,
  SelectQueryBuilder,
} from 'typeorm';
import { entityList } from './entities';

export const SQLITE_DRIVER = 'better-sqlite3';
const DEFAULT_SQLITE_PATH = 'data/byttrading.sqlite';

// Entities are written for Postgres and stay that way, so the Postgres schema
// and its migrations are untouched. This rewrites the column metadata in place
// to the closest SQLite types before the DataSource reads it.
//
// Decimals become TEXT, not SQLite's NUMERIC: NUMERIC stores values as 64 bit
// floats, which would silently corrupt balances beyond 15 significant digits.
// The transformer reproduces Postgres behaviour: values round to the column's
// scale on write and read back padded ("100.00000000"). This is only safe
// because nothing compares or aggregates decimal columns in SQL.
function rewriteColumnTypesForSqlite() {
  for (const { options } of getMetadataArgsStorage().columns) {
    switch (options.type) {
      case 'timestamptz':
        options.type = 'datetime';
        break;
      case 'jsonb':
        options.type = 'simple-json';
        break;
      case 'enum':
        options.type = 'simple-enum';
        break;
      case 'decimal': {
        const scale = options.scale ?? 0;
        options.type = 'text';
        delete options.precision;
        delete options.scale;
        const toFixedScale = (value: unknown) =>
          typeof value === 'string' || typeof value === 'number'
            ? new Decimal(value).toFixed(scale, Decimal.ROUND_HALF_UP)
            : value;
        options.transformer = { to: toFixedScale, from: toFixedScale };
        break;
      }
    }
  }
}

// SQLite has no row locks, and TypeORM throws if asked for one. Every
// transaction here runs one at a time (see installSqliteGate), which gives the
// same guarantee the pessimistic locks exist to provide.
function ignorePessimisticLocks() {
  const proto = SelectQueryBuilder.prototype as unknown as {
    setLock: (this: { connection: DataSource }, ...args: unknown[]) => unknown;
  };
  const original = proto.setLock;
  proto.setLock = function (...args: unknown[]) {
    return this.connection.options.type === SQLITE_DRIVER
      ? this
      : original.apply(this, args);
  };
}

let prepared = false;

export function sqliteDataSourceOptions(path?: string): DataSourceOptions {
  if (!prepared) {
    rewriteColumnTypesForSqlite();
    ignorePessimisticLocks();
    prepared = true;
  }
  // A relative path resolves against the working directory, so starting the
  // app from the wrong folder would silently create a new, empty database.
  if (process.env.NODE_ENV === 'production' && !(path && isAbsolute(path))) {
    throw new Error('In production SQLITE_PATH must be an absolute path.');
  }
  const database = path || DEFAULT_SQLITE_PATH;
  mkdirSync(dirname(database), { recursive: true });
  return {
    type: SQLITE_DRIVER,
    database,
    entities: entityList,
    enableWAL: true,
    // Separate from ../migrations, which is Postgres SQL. Run automatically at
    // startup: this file has one writer, so there is nothing to coordinate with.
    migrations: [__dirname + '/migrations-sqlite/*.{ts,js}'],
    migrationsRun: true,
    synchronize: false,
  };
}

// TypeORM's SQLite driver has a single connection shared by the whole app, so
// two overlapping transactions would run inside each other: one could read the
// other's uncommitted balance, and a rollback would undo both. This queue lets
// one transaction, multi statement save, or standalone query run at a time.
// Work started inside a holder runs straight through, so nesting cannot
// deadlock. The cost is that a slow transaction blocks all other queries.
export function installSqliteGate(dataSource: DataSource) {
  const holder = new AsyncLocalStorage<{ active: boolean }>();
  let tail: Promise<unknown> = Promise.resolve();

  const gated = <T>(work: () => Promise<T>): Promise<T> => {
    // `active` guards fire and forget work (such as `void mail.send()`) that
    // inherits this context but outlives the holder that started it.
    if (holder.getStore()?.active) return work();
    const token = { active: true };
    const result = tail.then(() => holder.run(token, work));
    const finished = result
      .catch(() => undefined)
      .then(() => {
        token.active = false;
      });
    tail = finished;
    return result;
  };

  type AsyncMethod = (...args: unknown[]) => Promise<unknown>;
  const wrap = (target: object, methods: string[]) => {
    const record = target as Record<string, AsyncMethod>;
    for (const method of methods) {
      const original = record[method].bind(target) as AsyncMethod;
      record[method] = (...args) => gated(() => original(...args));
    }
  };

  const manager: EntityManager = dataSource.manager;
  wrap(manager, ['transaction', 'save', 'remove', 'softRemove', 'recover']);
  wrap(dataSource.driver.createQueryRunner('master'), ['query']);
}
