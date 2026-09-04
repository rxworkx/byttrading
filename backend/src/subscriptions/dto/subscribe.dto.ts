import { IsIn, IsOptional, IsString } from 'class-validator';

export class SubscribeDto {
  @IsString()
  planId: string;

  @IsIn(['SIX_MONTHS', 'ONE_YEAR'])
  term: 'SIX_MONTHS' | 'ONE_YEAR';

  // Symbol of the company-accepted token the fee is being paid in.
  @IsString()
  symbol: string;

  @IsOptional()
  @IsString()
  txHash?: string;
}
