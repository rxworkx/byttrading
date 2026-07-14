import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '../../database/entities';

export class SendNotificationDto {
  // Omit to broadcast to every user.
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsIn(Object.values(NotificationType))
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
