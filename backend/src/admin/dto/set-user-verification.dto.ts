import { IsBoolean, IsOptional } from 'class-validator';

export class SetUserVerificationDto {
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;
}
