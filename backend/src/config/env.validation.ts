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
  COOKIE_DOMAIN = 'localhost';

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
