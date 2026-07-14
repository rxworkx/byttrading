import { IsNumberString, IsString } from 'class-validator';

export class TransferDto {
  @IsString()
  fromSymbol: string;

  @IsString()
  toSymbol: string;

  @IsNumberString()
  amount: string;
}
