import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DoctorScheduleService } from './doctor-schedule.service';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { CreateDoctorScheduleDto, UpdateDoctorScheduleDto } from './dto/doctor-schedule.dto';

@ApiTags('Doctor Schedules')
@Controller('doctor-schedules')
export class DoctorScheduleController {
  constructor(private readonly doctorScheduleService: DoctorScheduleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new doctor schedule' })
  @ApiResponse({ status: 201, description: 'Doctor schedule created successfully', type: DoctorSchedule })
  create(@Body() createDto: CreateDoctorScheduleDto): Promise<DoctorSchedule> {
    return this.doctorScheduleService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all doctor schedules' })
  @ApiResponse({ status: 200, type: [DoctorSchedule] })
  findAll(): Promise<DoctorSchedule[]> {
    return this.doctorScheduleService.findAll();
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get schedules within a date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, type: [DoctorSchedule] })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<DoctorSchedule[]> {
    return this.doctorScheduleService.findByDateRange(startDate, endDate);
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Get schedules for a specific doctor' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date filter (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, type: [DoctorSchedule] })
  findByDoctor(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<DoctorSchedule[]> {
    return this.doctorScheduleService.findByDoctor(doctorId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor schedule by ID' })
  @ApiResponse({ status: 200, type: DoctorSchedule })
  findOne(@Param('id') id: string): Promise<DoctorSchedule> {
    return this.doctorScheduleService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update doctor schedule' })
  @ApiResponse({ status: 200, type: DoctorSchedule })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDoctorScheduleDto
  ): Promise<DoctorSchedule> {
    return this.doctorScheduleService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete doctor schedule' })
  @ApiResponse({ status: 200, description: 'Doctor schedule deleted successfully' })
  remove(@Param('id') id: string): Promise<void> {
    return this.doctorScheduleService.remove(id);
  }
}
