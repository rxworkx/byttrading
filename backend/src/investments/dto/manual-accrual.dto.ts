import { IsNumberString, IsOptional } from 'class-validator';

export class ManualAccrualDto {
  @IsOptional()
  @IsNumberString()
  ratePercent?: string;

  @IsOptional()
  @IsNumberString()
  amount?: string;
}
