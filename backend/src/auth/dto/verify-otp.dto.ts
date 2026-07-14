import { IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  ref: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
