import { IsString, IsOptional, IsDateString, IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  reminderTime: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType = NotificationType.GENERAL_REMINDER;

  @IsInt()
  @IsOptional()
  relatedEntityId?: number;

  @IsString()
  @IsOptional()
  relatedEntityType?: string;

  @IsInt()
  userId: number;
}
