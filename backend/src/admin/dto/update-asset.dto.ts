import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class UpdateAssetDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  showInWalletList?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
