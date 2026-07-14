import { IsIn, IsString } from 'class-validator';

export class SubscribeDto {
  @IsString()
  planId: string;

  @IsIn(['SIX_MONTHS', 'ONE_YEAR'])
  term: 'SIX_MONTHS' | 'ONE_YEAR';

  @IsString()
  walletSymbol: string;
}
