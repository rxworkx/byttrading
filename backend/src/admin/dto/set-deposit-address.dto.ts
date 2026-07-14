import { IsString } from 'class-validator';

export class SetDepositAddressDto {
  @IsString()
  address: string;
}
