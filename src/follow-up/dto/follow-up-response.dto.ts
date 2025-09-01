import { ApiProperty } from '@nestjs/swagger';
import { FollowUpKind, FollowUpStatus } from '../entities/follow-up.entity';

export class FollowUpResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bookId: string;

  @ApiProperty()
  dueAt: Date;

  @ApiProperty({ enum: ['review', 'lab_review', 'repeat_rx', 'procedure'] })
  kind: FollowUpKind;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ enum: ['upcoming', 'completed', 'missed', 'cancelled'] })
  status: FollowUpStatus;

  @ApiProperty({ required: false })
  remindAt1?: Date;

  @ApiProperty({ required: false })
  remindAt2?: Date;

  @ApiProperty({ enum: ['push', 'sms', 'email'] })
  channel: 'push' | 'sms' | 'email';

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class FollowUpStatisticsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  upcoming: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  missed: number;

  @ApiProperty()
  cancelled: number;

  @ApiProperty()
  overdue: number;
}
