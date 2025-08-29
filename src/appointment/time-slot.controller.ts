import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TimeSlotService } from './time-slot.service';
import { TimeSlot } from './entities/time-slot.entity';
import { 
  GenerateTimeSlotsDto, 
  UpdateTimeSlotStatusDto, 
  TimeSlotResponseDto 
} from './dto/time-slot.dto';

@ApiTags('Time Slots')
@Controller('time-slots')
export class TimeSlotController {
  constructor(private readonly timeSlotService: TimeSlotService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate time slots for a doctor schedule (with date range)' })
  @ApiResponse({ status: 201, description: 'Time slots generated successfully', type: [TimeSlot] })
  generateSlots(@Body() generateDto: GenerateTimeSlotsDto): Promise<TimeSlot[]> {
    return this.timeSlotService.generateTimeSlots(generateDto);
  }

  @Post('generate/:scheduleId')
  @ApiOperation({ summary: 'Generate time slots for a specific doctor schedule' })
  @ApiResponse({ status: 201, description: 'Time slots generated successfully', type: [TimeSlot] })
  generateSlotsForSchedule(@Param('scheduleId') scheduleId: string): Promise<TimeSlot[]> {
    return this.timeSlotService.generateTimeSlotsForSchedule(scheduleId);
  }

  @Get('available/:doctorId')
  @ApiOperation({ summary: 'Get available time slots for a doctor' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, type: [TimeSlotResponseDto] })
  findAvailableSlots(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<TimeSlotResponseDto[]> {
    return this.timeSlotService.findAvailableSlots(doctorId, startDate, endDate);
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Get all time slots for a doctor' })
  @ApiResponse({ status: 200, type: [TimeSlotResponseDto] })
  findByDoctor(@Param('doctorId', ParseIntPipe) doctorId: number): Promise<TimeSlotResponseDto[]> {
    return this.timeSlotService.findByDoctor(doctorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get time slot by ID' })
  @ApiResponse({ status: 200, type: TimeSlot })
  findOne(@Param('id') id: string): Promise<TimeSlot> {
    return this.timeSlotService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update time slot status' })
  @ApiResponse({ status: 200, type: TimeSlot })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateTimeSlotStatusDto
  ): Promise<TimeSlot> {
    return this.timeSlotService.updateStatus(id, updateDto);
  }
}
