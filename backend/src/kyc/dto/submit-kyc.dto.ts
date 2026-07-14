import { IsOptional, IsString } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  documentType: string;

  @IsString()
  documentFrontUrl: string;

  @IsOptional()
  @IsString()
  documentBackUrl?: string;

  @IsOptional()
  @IsString()
  selfieUrl?: string;
}
