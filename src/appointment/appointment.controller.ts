import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({
    status: 201,
    description: 'Appointment created successfully',
    type: AppointmentResponseDto,
  })
  create(@Body() createAppointmentDto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    return this.appointmentService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments' })
  @ApiResponse({ status: 200, type: [AppointmentResponseDto] })
  findAll(): Promise<AppointmentResponseDto[]> {
    return this.appointmentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, type: AppointmentResponseDto })
  findOne(@Param('id') id: string): Promise<AppointmentResponseDto> {
    return this.appointmentService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get appointments for a specific user' })
  @ApiResponse({ status: 200, type: [AppointmentResponseDto] })
  findByUser(@Param('userId', ParseIntPipe) userId: number): Promise<AppointmentResponseDto[]> {
    return this.appointmentService.findByUser(userId);
  }


}
