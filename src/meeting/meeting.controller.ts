import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { MeetingService } from './meeting.service';
import { MeetingResponseDto } from './dto/meeting-response.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { CreateQuickMeetingDto } from './dto/create-quick-meeting.dto';
import { CreateStandaloneMeetingDto } from './dto/create-standalone-meeting.dto';
import { StandaloneMeetingResponseDto } from './dto/standalone-meeting-response.dto';

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

  @Get(':id')
  @ApiOperation({ summary: 'Get meeting by ID' })
  @ApiResponse({ status: 200, type: MeetingResponseDto })
  findById(@Param('id') id: string): Promise<MeetingResponseDto> {
    return this.meetingService.findById(id);
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get meeting by appointment ID' })
  @ApiResponse({ status: 200, type: MeetingResponseDto })
  findByAppointment(@Param('appointmentId') appointmentId: string): Promise<MeetingResponseDto> {
    return this.meetingService.findByAppointmentId(appointmentId);
  }

  @Get('zoom-link/:appointmentId')
  @ApiOperation({ summary: 'Get Zoom link for an appointment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the Zoom join URL and password',
    schema: {
      type: 'object',
      properties: {
        joinUrl: { type: 'string', example: 'https://zoom.us/j/123456789' },
        password: { type: 'string', example: 'abc123' }
      }
    }
  })
  async getZoomLink(@Param('appointmentId') appointmentId: string): Promise<{ joinUrl: string; password?: string }> {
    return this.meetingService.getZoomLink(appointmentId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new scheduled meeting' })
  @ApiBody({ type: CreateMeetingDto })
  @ApiResponse({ status: 201, type: MeetingResponseDto })
  createMeeting(@Body() createMeetingDto: CreateMeetingDto): Promise<MeetingResponseDto> {
    return this.meetingService.createMeeting(createMeetingDto);
  }

  @Post('quick')
  @ApiOperation({ summary: 'Create a quick/instant meeting' })
  @ApiBody({ type: CreateQuickMeetingDto })
  @ApiResponse({ status: 201, type: MeetingResponseDto })
  createQuickMeeting(@Body() createQuickMeetingDto: CreateQuickMeetingDto): Promise<MeetingResponseDto> {
    return this.meetingService.createQuickMeeting(createQuickMeetingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a meeting' })
  @ApiResponse({ status: 204, description: 'Meeting deleted successfully' })
  async deleteMeeting(@Param('id') id: string): Promise<void> {
    await this.meetingService.deleteMeeting(id);
  }

  // ========== STANDALONE MEETING ENDPOINTS ==========

  @Post('standalone')
  @ApiOperation({ summary: 'Create a standalone meeting (no appointment required)' })
  @ApiBody({ type: CreateStandaloneMeetingDto })
  @ApiResponse({ status: 201, type: StandaloneMeetingResponseDto })
  createStandaloneMeeting(@Body() createStandaloneMeetingDto: CreateStandaloneMeetingDto): Promise<StandaloneMeetingResponseDto> {
    return this.meetingService.createStandaloneMeeting(createStandaloneMeetingDto);
  }

  @Get('standalone')
  @ApiOperation({ summary: 'Get all standalone meetings' })
  @ApiResponse({ status: 200, type: [StandaloneMeetingResponseDto] })
  findAllStandalone(): Promise<StandaloneMeetingResponseDto[]> {
    return this.meetingService.findAllStandalone();
  }

  @Get('standalone/:id')
  @ApiOperation({ summary: 'Get standalone meeting by ID' })
  @ApiResponse({ status: 200, type: StandaloneMeetingResponseDto })
  findStandaloneById(@Param('id') id: string): Promise<StandaloneMeetingResponseDto> {
    return this.meetingService.findStandaloneById(id);
  }

  @Get('standalone/:id/zoom-link')
  @ApiOperation({ summary: 'Get Zoom link for standalone meeting' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the Zoom join URL and password for standalone meeting',
    schema: {
      type: 'object',
      properties: {
        joinUrl: { type: 'string', example: 'https://zoom.us/j/123456789' },
        password: { type: 'string', example: 'abc123' }
      }
    }
  })
  async getStandaloneZoomLink(@Param('id') id: string): Promise<{ joinUrl: string; password?: string }> {
    return this.meetingService.getStandaloneZoomLink(id);
  }
}
