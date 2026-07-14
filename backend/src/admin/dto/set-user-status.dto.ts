import { IsIn } from 'class-validator';
import { UserStatus } from '../../database/entities';

export class SetUserStatusDto {
  @IsIn(Object.values(UserStatus))
  status: UserStatus;
}
