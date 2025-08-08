import { ApiProperty } from '@nestjs/swagger';

export class MeetingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  roomLink: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ example: 'appointment-id-uuid' })
  appointmentId: string;

  @ApiProperty({ example: 'meeting-id-uuid' })
  meetingId: string; 
}
