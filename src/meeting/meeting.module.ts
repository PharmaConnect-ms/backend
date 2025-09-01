// src/meeting/meeting.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Meeting } from './entities/meeting.entity';
import { MeetingService } from './meeting.service';
import { MeetingController } from './meeting.controller';
import { ZoomService } from './zoom.service';
import { Appointment } from '@/appointment/entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meeting, Appointment]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [MeetingController],
  providers: [MeetingService, ZoomService],
  exports: [MeetingService, ZoomService],
})
export class MeetingModule {}
