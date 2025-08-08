import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting } from './entities/meeting.entity';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { MeetingResponseDto } from './dto/meeting-response.dto';
import generateToken from './jaasJWTTokenGenerator';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';



@Injectable()
export class MeetingService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepo: Repository<Meeting>,

    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  async findByAppointmentId(appointmentId: string): Promise<MeetingResponseDto> {
    const meeting = await this.meetingRepo.findOne({
      where: { appointment: { id: appointmentId } },
      relations: ['appointment'],
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting not found for appointment ${appointmentId}`);
    }

    return {
      id: meeting.id,
      roomLink: meeting.roomLink,
      status: meeting.status,
      createdAt: meeting.createdAt,
      appointmentId: meeting.appointment.id,
      meetingId: meeting.meetingId, 
    };
  }

  async findAll(): Promise<MeetingResponseDto[]> {
    const meetings = await this.meetingRepo.find({
      relations: ['appointment'],
      order: { createdAt: 'DESC' },
    });

    if (!meetings || meetings.length === 0) {
      throw new NotFoundException('No meetings found');
    }

    return meetings.map(m => ({
      id: m.id,
      roomLink: m.roomLink,
      status: m.status,
      createdAt: m.createdAt,
      appointmentId: m.appointment.id,
      meetingId: m.meetingId, // Include meetingId in the response
    }));
  }

  async getToken(id: string , name:string): Promise<string> {
    return this.meetingRepo.findOne({ where: { meetingId: id } }).then(meeting => {
  
     // const privateKey = process.env.JAAS_PRIVATE_KEY;
     const privateKeyPath = path.join(__dirname, '..', '..', 'src', 'certs', 'jists', 'pk.pk');
     const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

      if (!privateKey) {
        throw new Error('JAAS_PRIVATE_KEY is not defined in the environment variables');
      }
      const appId = "vpaas-magic-cookie-3b77f06727bf40449f82968dd34470c9";
      const kid = "vpaas-magic-cookie-3b77f06727bf40449f82968dd34470c9/bec71d";

      if (!appId || !kid) {
        throw new Error('JAAS_KEY_ID or JAAS_KEY_SECRET is not defined in the environment variables');
      }
      
      const id = uuid();
      const email = "email@gmail.com";
      const userPayload = { id, name, email, appId, kid };
      const token = generateToken(privateKey, userPayload);
      if (!token) {
        throw new Error('Failed to generate token');
      }
      return token;
    });
  }
  
}
