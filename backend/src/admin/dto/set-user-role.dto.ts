import { IsIn } from 'class-validator';
import { Role } from '../../database/entities';

export class SetUserRoleDto {
  @IsIn([Role.USER, Role.ADMIN])
  role: Role;
}
