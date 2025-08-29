import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { TimeSlotStatus } from '../types';

export class GenerateTimeSlotsDto {
  @ApiProperty({ description: 'Doctor schedule ID' })
  @IsString()
  doctorScheduleId: string;

  @ApiProperty({ description: 'Start date to generate slots from', example: '2025-08-30' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date to generate slots until', example: '2025-09-30' })
  @IsDateString()
  endDate: string;
}

export class UpdateTimeSlotStatusDto {
  @ApiProperty({ enum: TimeSlotStatus, description: 'New status for the time slot' })
  @IsEnum(TimeSlotStatus)
  status: TimeSlotStatus;

  @ApiProperty({ description: 'Optional notes for the status update', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TimeSlotResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty({ enum: TimeSlotStatus })
  status: TimeSlotStatus;

  @ApiProperty()
  doctorSchedule: {
    id: string;
    doctor: {
      id: number;
      username: string;
    };
    date: Date;
    slotDurationMinutes: number;
  };

  @ApiProperty({ required: false })
  appointment?: {
    id: string;
    appointmentNo: number;
    type: string;
    patient: {
      id: number;
      username: string;
    };
  };
}
