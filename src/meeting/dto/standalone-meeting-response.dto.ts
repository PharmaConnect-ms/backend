import { ApiProperty } from '@nestjs/swagger';

export class StandaloneMeetingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  zoomMeetingId: string;

  @ApiProperty()
  joinUrl: string;

  @ApiProperty()
  startUrl: string;

  @ApiProperty({ required: false })
  password?: string;

  @ApiProperty()
  topic: string;

  @ApiProperty({ required: false })
  startTime?: Date;

  @ApiProperty()
  duration: number;

  @ApiProperty({ required: false })
  agenda?: string;

  @ApiProperty()
  hostEmail: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  meetingType: string; // 'standalone' vs 'appointment'
}
