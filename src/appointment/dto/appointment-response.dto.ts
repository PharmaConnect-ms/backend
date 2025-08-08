import { ApiProperty } from '@nestjs/swagger';
import { AppointmentType } from '../entities/appointment.entity';
import { UserSummaryDto } from '@/common/dto/user-summary.dto';

export class AppointmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AppointmentType })
  type: AppointmentType;

  @ApiProperty()
  scheduledAt: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  appointmentNo: number;

  @ApiProperty({ type: UserSummaryDto })
  doctor: UserSummaryDto;

  @ApiProperty({ type: UserSummaryDto })
  patient: UserSummaryDto;

  @ApiProperty({ required: false })
  meetingLink?: string;
}
