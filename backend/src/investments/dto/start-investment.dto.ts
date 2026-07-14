import { IsNumberString, IsString } from 'class-validator';

export class StartInvestmentDto {
  @IsString()
  planId: string;

  @IsNumberString()
  principal: string;

  @IsString()
  walletSymbol: string;
}
