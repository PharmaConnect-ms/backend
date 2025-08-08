import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MeetingService } from './meeting.service';
import { MeetingResponseDto } from './dto/meeting-response.dto';

@ApiTags('Meetings')
@Controller('meetings')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Get()
  @ApiOperation({ summary: 'Get all meetings' })
  @ApiResponse({ status: 200, type: [MeetingResponseDto] })
  findAll(): Promise<MeetingResponseDto[]> {
    return this.meetingService.findAll();
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get meeting by appointment ID' })
  @ApiResponse({ status: 200, type: MeetingResponseDto })
  findByAppointment(@Param('appointmentId') appointmentId: string): Promise<MeetingResponseDto> {
    return this.meetingService.findByAppointmentId(appointmentId);
  }

  @Get('getToken/:id/:name')
  @ApiOperation({ summary: 'Get meeting token for an appointment' })
  @ApiResponse({ status: 200, type: String })
  async getToken(
    @Param('id') id: string,
    @Param('name') name: string
  ): Promise<string> {
    return this.meetingService.getToken(id, name);
  }
  

}
