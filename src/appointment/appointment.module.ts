// src/appointment/appointment.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { TimeSlot } from './entities/time-slot.entity';
import { AppointmentService } from './appointment.service';
import { DoctorScheduleService } from './doctor-schedule.service';
import { TimeSlotService } from './time-slot.service';
import { AppointmentController } from './appointment.controller';
import { DoctorScheduleController } from './doctor-schedule.controller';
import { TimeSlotController } from './time-slot.controller';
import { User } from '@/users/user.entity';
import { Meeting } from '@/meeting/entities/meeting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment, 
      DoctorSchedule, 
      TimeSlot, 
      User, 
      Meeting
    ])
  ],
  controllers: [
    AppointmentController, 
    DoctorScheduleController, 
    TimeSlotController
  ],
  providers: [
    AppointmentService, 
    DoctorScheduleService, 
    TimeSlotService
  ],
  exports: [
    AppointmentService, 
    DoctorScheduleService, 
    TimeSlotService
  ],
})
export class AppointmentModule {}
