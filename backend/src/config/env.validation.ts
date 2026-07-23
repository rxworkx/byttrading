import { Type, plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;

  // The running app's connection, kept separate from DATABASE_URL because
  // migrations (data-source.ts) need Supavisor's session mode (advisory
  // locks, prepared statements), while the app itself should use
  // transaction mode instead: session mode caps concurrent clients much
  // lower (pool_size, e.g. 15 on the free tier) and reserves one Postgres
  // backend per client for its whole connection lifetime, so a restart or
  // crash-loop can exhaust it outright (EMAXCONNSESSION) in a way
  // transaction mode's multiplexed pool does not. Falls back to
  // DATABASE_URL so local dev with a single connection string still works.
  @IsOptional()
  @IsString()
  DATABASE_POOL_URL?: string;

  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_TTL = '15m';

  @IsOptional()
  @IsString()
  JWT_REFRESH_TTL = '30d';

  @IsOptional()
  @IsString()
  COOKIE_DOMAIN?: string;

  @IsOptional()
  @IsString()
  FRONTEND_URL = 'http://localhost:3000';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  PORT = 4000;

  @IsOptional()
  @IsString()
  COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV = 'development';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }
  return validatedConfig;
}
