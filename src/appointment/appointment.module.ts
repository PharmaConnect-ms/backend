// src/appointment/appointment.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { User } from '@/users/user.entity';
import { Meeting } from '@/meeting/entities/meeting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, User, Meeting])],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}
