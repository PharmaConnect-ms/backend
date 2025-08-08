// src/meeting/meeting.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting } from './entities/meeting.entity';
import { MeetingService } from './meeting.service';
import { MeetingController } from './meeting.controller';
import { Appointment } from '@/appointment/entities/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting, Appointment])],
  controllers: [MeetingController],
  providers: [MeetingService],
})
export class MeetingModule {}
