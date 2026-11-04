import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { entityList } from './entities';
import { sqliteDataSourceOptions } from './sqlite-compat';

// The Supabase direct (non-pooled) host only resolves to an IPv6 address in some
// environments, so DATABASE_URL (the Supavisor pooler, session mode / port 5432) is used
// for both the running app and CLI migrations here — session mode supports prepared
// statements and advisory locks, so it works fine for migrations too.
export const dataSourceOptions: DataSourceOptions =
  process.env.DATABASE_DRIVER === 'sqlite'
    ? sqliteDataSourceOptions(process.env.SQLITE_PATH)
    : {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: entityList,
        migrations: [__dirname + '/migrations/*.{ts,js}'],
        ssl: { rejectUnauthorized: false },
      };

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
