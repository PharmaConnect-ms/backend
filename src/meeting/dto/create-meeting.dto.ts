import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateMeetingDto {
  @ApiProperty({ example: 'appointment-id-uuid' })
  @IsString()
  appointmentId: string;

  @ApiProperty({ example: 'doctor@example.com' })
  @IsEmail()
  hostEmail: string;

  @ApiProperty({ example: 'Medical Consultation' })
  @IsString()
  topic: string;

  @ApiProperty({ required: false, example: '2024-09-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiProperty({ required: false, default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiProperty({ required: false, example: 'Follow-up consultation for patient' })
  @IsOptional()
  @IsString()
  agenda?: string;
}
