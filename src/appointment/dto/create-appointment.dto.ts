import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional } from 'class-validator';
import { AppointmentType } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Time slot ID to book' })
  @IsString()
  timeSlotId: string;

  @ApiProperty({ description: 'Patient ID who is booking the appointment' })
  @IsNumber()
  patientId: number;

  @ApiProperty({ enum: AppointmentType, description: 'Type of appointment' })
  @IsEnum(AppointmentType)
  type: AppointmentType;

  @ApiProperty({ description: 'Optional notes for the appointment', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
