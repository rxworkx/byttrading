import { IsNumberString, IsString } from 'class-validator';

export class WithdrawDto {
  @IsString()
  symbol: string;

  @IsNumberString()
  amount: string;

  @IsString()
  destinationAddress: string;
}
