import { ApiProperty } from '@nestjs/swagger';
import { AppointmentType, AppointmentStatus } from '../entities/appointment.entity';
import { UserSummaryDto } from '@/common/dto/user-summary.dto';

export class AppointmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AppointmentType })
  type: AppointmentType;

  @ApiProperty()
  scheduledAt: Date;

  @ApiProperty({ enum: AppointmentStatus })
  status: AppointmentStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  appointmentNo: number;

  @ApiProperty({ type: UserSummaryDto })
  doctor: UserSummaryDto;

  @ApiProperty({ type: UserSummaryDto })
  patient: UserSummaryDto;

  @ApiProperty()
  timeSlot: {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    status: string;
  };

  @ApiProperty({ required: false })
  meetingLink?: string;

  @ApiProperty({ required: false })
  notes?: string;
}
