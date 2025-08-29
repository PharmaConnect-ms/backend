import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus, description: 'New appointment status' })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiProperty({ description: 'Optional notes for the status update', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
