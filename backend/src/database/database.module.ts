import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entityList } from './entities';
import { DatabaseKeepAliveService } from './database-keep-alive.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: entityList,
        ssl: { rejectUnauthorized: false },
        synchronize: false,
        migrationsRun: false,
        logging:
          config.get('NODE_ENV') === 'development'
            ? ['error', 'warn']
            : ['error'],
        // The Supabase pooler drops idle client connections, which makes the
        // first query after any quiet period pay a multi-second reconnect
        // cost. Keep a small pool warm and let DatabaseKeepAliveService ping
        // it periodically so most requests hit an already-open connection.
        extra: {
          max: 10,
          keepAlive: true,
          idleTimeoutMillis: 60_000,
          connectionTimeoutMillis: 10_000,
        },
      }),
    }),
  ],
  providers: [DatabaseKeepAliveService],
})
export class DatabaseModule {}
