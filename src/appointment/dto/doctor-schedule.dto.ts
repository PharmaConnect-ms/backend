import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateDoctorScheduleDto {
  @ApiProperty({ description: 'Doctor user ID' })
  @IsNumber()
  doctorId: number;

  @ApiProperty({ description: 'Specific date for the schedule', example: '2025-08-30' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Start time in HH:MM format', example: '09:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'End time in HH:MM format', example: '17:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ description: 'Duration of each appointment slot in minutes', example: 30 })
  @IsNumber()
  slotDurationMinutes: number;

  @ApiProperty({ description: 'Whether the schedule is active', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDoctorScheduleDto {
  @ApiProperty({ description: 'Specific date for the schedule', example: '2025-08-30', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ description: 'Start time in HH:MM format', example: '09:00', required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ description: 'End time in HH:MM format', example: '17:00', required: false })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ description: 'Duration of each appointment slot in minutes', example: 30, required: false })
  @IsOptional()
  @IsNumber()
  slotDurationMinutes?: number;

  @ApiProperty({ description: 'Whether the schedule is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
