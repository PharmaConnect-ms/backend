import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class CreateQuickMeetingDto {
  @ApiProperty({ example: 'appointment-id-uuid' })
  @IsString()
  appointmentId: string;

  @ApiProperty({ example: 'doctor@example.com' })
  @IsEmail()
  hostEmail: string;

  @ApiProperty({ example: 'Emergency Medical Consultation', required: false })
  @IsString()
  topic?: string;
}
