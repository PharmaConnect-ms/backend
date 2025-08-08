import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentType } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { User } from '@/users/user.entity';
import { Meeting } from '@/meeting/entities/meeting.entity';
import { v4 as uuid } from 'uuid';
import { Between } from 'typeorm';
import { BadRequestException } from '@nestjs/common';



@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Meeting)
    private readonly meetingRepo: Repository<Meeting>,
  ) {}

  private toResponseDto(appointment: Appointment): AppointmentResponseDto {
    return {
      id: appointment.id,
      type: appointment.type,
      scheduledAt: appointment.scheduledAt,
      status: appointment.status,
      createdAt: appointment.createdAt,
      doctor: {
        id: appointment.doctor.id,
        username: appointment.doctor.username,
      },
      patient: {
        id: appointment.patient.id,
        username: appointment.patient.username,
      },
      meetingLink: appointment.meeting?.roomLink,
      appointmentNo: appointment.appointmentNo,
    };
  }

  async create(dto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    const doctor = await this.userRepo.findOne({ where: { id: dto.doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');
  
    const patient = await this.userRepo.findOne({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException('Patient not found');
  
    // Determine the base date (ignore the time from dto.scheduledAt)
    const baseDate = new Date(dto.scheduledAt);
    baseDate.setHours(0, 0, 0, 0);
  
    const startOfDay = new Date(baseDate);
    const endOfDay = new Date(baseDate);
    endOfDay.setHours(23, 59, 59, 999);
  
    // Get existing appointments for the doctor on that day
    const appointmentsToday = await this.appointmentRepo.find({
      where: {
        doctor: { id: doctor.id },
        scheduledAt: Between(startOfDay, endOfDay),
      },
      order: { scheduledAt: 'ASC' }, // Ensure consistent ordering
    });
  
    if (appointmentsToday.length >= 10) {
      throw new BadRequestException('Doctor is fully booked for this day.');
    }
  
    const appointmentNo = appointmentsToday.length + 1;
  
    // Calculate slot time based on index
    const scheduledAt = new Date(baseDate);
    scheduledAt.setHours(19, 0, 0, 0); // 7:00 PM start
    scheduledAt.setMinutes(scheduledAt.getMinutes() + (appointmentNo - 1) * 10); // +10 min per slot
  
    const appointment = this.appointmentRepo.create({
      doctor,
      patient,
      scheduledAt,
      type: dto.type,
      status: 'pending',
      appointmentNo,
    });
  
    const saved = await this.appointmentRepo.save(appointment);
  
    if (dto.type === AppointmentType.ONLINE) {
      const meeting = this.meetingRepo.create({
        appointment: saved,
        roomLink: `https://meet.jit.si/pharmaconnect-${uuid()}`,
        meetingId: uuid(),
      });
      await this.meetingRepo.save(meeting);
      saved.meeting = meeting;
    }
  
    return this.toResponseDto(saved);
  }

  async findAll(): Promise<AppointmentResponseDto[]> {
    const appointments = await this.appointmentRepo.find({
      relations: ['doctor', 'patient', 'meeting'],
      order: { scheduledAt: 'DESC' },
    });

    return appointments.map(a => this.toResponseDto(a));
  }

  async findOne(id: string): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['doctor', 'patient', 'meeting'],
    });

    if (!appointment) throw new NotFoundException(`Appointment not found`);
    return this.toResponseDto(appointment);
  }

  async findByUser(userId: number): Promise<AppointmentResponseDto[]> {
    const appointments = await this.appointmentRepo.find({
      where: [
        { doctor: { id: userId } },
        { patient: { id: userId } },
      ],
      relations: ['doctor', 'patient', 'meeting'],
      order: { scheduledAt: 'DESC' },
    });

    return appointments.map(a => this.toResponseDto(a));
  }
}
