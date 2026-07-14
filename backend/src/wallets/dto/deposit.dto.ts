import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class DepositDto {
  @IsString()
  symbol: string;

  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  txHash?: string;
}
