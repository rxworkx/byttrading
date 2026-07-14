import { IsBoolean, IsOptional, IsNumber, Min } from 'class-validator';

export class SetUserTxLimitDto {
  @IsOptional()
  @IsBoolean()
  freeze?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWithdrawal?: number | null;
}
