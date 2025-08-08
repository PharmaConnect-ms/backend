import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsDateString, IsNumber } from 'class-validator';
import { AppointmentType } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsNumber()
  doctorId: number;

  @ApiProperty()
  @IsNumber()
  patientId: number;

  @ApiProperty({ enum: AppointmentType })
  @IsEnum(AppointmentType)
  type: AppointmentType;

  @ApiProperty()
  @IsDateString()
  scheduledAt: string;
}
