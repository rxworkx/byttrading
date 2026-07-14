import { IsBoolean, IsObject, IsOptional, IsString, Matches } from 'class-validator';
import type { PlanPricing } from '../../database/entities';
import { RATE_RANGE_PATTERN } from '../../investments/rate-range.util';

// "5 days", "1 day", "5 min", "daily", parsed by term.util.ts's termToSeconds.
const TERM_PATTERN = /^(\d+\s+)?[a-zA-Z]+$/;

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @Matches(RATE_RANGE_PATTERN, { message: 'rateRange must look like "0.25-0.6" or a bare "1"' })
  rateRange?: string;

  @IsOptional()
  @IsString()
  rateNote?: string | null;

  @IsOptional()
  @IsObject()
  pricing?: PlanPricing;

  @IsOptional()
  @IsString()
  @Matches(TERM_PATTERN, { message: 'term must look like "5 days" or "daily"' })
  term?: string | null;

  @IsOptional()
  @IsString()
  @Matches(TERM_PATTERN, { message: 'payFrequency must look like "5 days" or "daily"' })
  payFrequency?: string;

  @IsOptional()
  @IsString()
  @Matches(TERM_PATTERN, { message: 'payWalletFrequency must look like "5 days" or "daily"' })
  payWalletFrequency?: string | null;

  @IsOptional()
  @IsString()
  @Matches(TERM_PATTERN, { message: 'minTerm must look like "5 days" or "daily"' })
  minTerm?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
