import { IsEnum } from 'class-validator';
import { UserRole } from '@bugflow-2026/shared-types';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
