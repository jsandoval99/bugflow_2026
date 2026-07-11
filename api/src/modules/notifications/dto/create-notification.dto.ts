import { IsEnum, IsString, IsUUID } from 'class-validator';
import { NotificationType } from '@bugflow-2026/shared-types';

export class CreateNotificationDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  issueId!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  message!: string;
}
