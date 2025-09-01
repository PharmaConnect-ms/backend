import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment, AppointmentType, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { User } from '@/users/user.entity';
import { Meeting } from '@/meeting/entities/meeting.entity';
import { TimeSlot } from './entities/time-slot.entity';
import { TimeSlotStatus } from './types';
import { MeetingService } from '@/meeting/meeting.service';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Meeting)
    private readonly meetingRepo: Repository<Meeting>,

    @InjectRepository(TimeSlot)
    private readonly timeSlotRepo: Repository<TimeSlot>,

    @Inject(forwardRef(() => MeetingService))
    private readonly meetingService: MeetingService,
  ) {}

  private toResponseDto(appointment: Appointment): AppointmentResponseDto {
    return {
      id: appointment.id,
      type: appointment.type,
      scheduledAt: appointment.scheduledAt,
      status: appointment.status,
      appointmentNo: appointment.appointmentNo,
      createdAt: appointment.createdAt,
      doctor: {
        id: appointment.doctor.id,
        username: appointment.doctor.username,
      },
      patient: {
        id: appointment.patient.id,
        username: appointment.patient.username,
        userSummary: appointment.patient.userSummary,
      },
      timeSlot: {
        id: appointment.timeSlot.id,
        date: appointment.timeSlot.date,
        startTime: appointment.timeSlot.startTime,
        endTime: appointment.timeSlot.endTime,
        status: appointment.timeSlot.status,
      },
      meetingLink: appointment.meeting?.joinUrl,
      notes: appointment.notes,
    };
  }

  async create(createDto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    // Find the time slot and verify it's available
    const timeSlot = await this.timeSlotRepo.findOne({
      where: { id: createDto.timeSlotId },
      relations: ['doctorSchedule', 'doctorSchedule.doctor'],
    });

    if (!timeSlot) {
      throw new NotFoundException('Time slot not found');
    }

    if (timeSlot.status !== TimeSlotStatus.AVAILABLE) {
      throw new BadRequestException('Time slot is not available');
    }

    // Verify patient exists
    const patient = await this.userRepo.findOne({
      where: { id: createDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Generate appointment number (sequential for the day per doctor)
    const appointmentDate = new Date(timeSlot.date);
    const appointmentNo = await this.generateAppointmentNumber(
      timeSlot.doctorSchedule.doctor.id,
      appointmentDate
    );

    // Create scheduled date/time from slot date and time
    const scheduledAt = this.createScheduledDateTime(timeSlot.date, timeSlot.startTime);

    // Create the appointment
    const appointment = this.appointmentRepo.create({
      doctor: timeSlot.doctorSchedule.doctor,
      patient,
      timeSlot,
      type: createDto.type,
      scheduledAt,
      status: AppointmentStatus.SCHEDULED,
      appointmentNo,
      notes: createDto.notes,
    });

    // Save appointment first
    const savedAppointment = await this.appointmentRepo.save(appointment);

    // If it's an online appointment, automatically create a Zoom meeting
    if (createDto.type === AppointmentType.ONLINE) {
      try {
        // Use the doctor's email as the host email
        const hostEmail = timeSlot.doctorSchedule.doctor.email;
        const topic = `Medical Consultation - Dr. ${timeSlot.doctorSchedule.doctor.username} & ${patient.username}`;
        
        // Create the meeting using the meeting service
        await this.meetingService.createMeeting({
          appointmentId: savedAppointment.id,
          hostEmail,
          topic,
          startTime: scheduledAt.toISOString(),
          duration: 60, // Default 60 minutes
          agenda: `Medical consultation appointment between Dr. ${timeSlot.doctorSchedule.doctor.username} and patient ${patient.username}`,
        });

        console.log(`Zoom meeting created automatically for online appointment ${savedAppointment.id}`);
      } catch (error) {
        console.error('Failed to create Zoom meeting for online appointment:', error);
        // Don't throw error here to prevent appointment creation failure
        // The meeting can be created later via the meeting API
      }
    }

    // Update time slot status to booked
    timeSlot.status = TimeSlotStatus.BOOKED;
    await this.timeSlotRepo.save(timeSlot);

    // Fetch the updated appointment with meeting relation
    const appointmentWithMeeting = await this.appointmentRepo.findOne({
      where: { id: savedAppointment.id },
      relations: ['doctor', 'patient', 'meeting', 'timeSlot'],
    });

    return this.toResponseDto(appointmentWithMeeting || savedAppointment);
  }

  async findAll(): Promise<AppointmentResponseDto[]> {
    const appointments = await this.appointmentRepo.find({
      relations: ['doctor', 'patient', 'meeting', 'timeSlot'],
      order: { scheduledAt: 'DESC' },
    });

    return appointments.map(a => this.toResponseDto(a));
  }

  async findOne(id: string): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['doctor', 'patient', 'meeting', 'timeSlot'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    
    return this.toResponseDto(appointment);
  }

  async findByUser(userId: number): Promise<AppointmentResponseDto[]> {
    const appointments = await this.appointmentRepo.find({
      where: [
        { doctor: { id: userId } },
        { patient: { id: userId } },
      ],
      relations: ['doctor', 'patient', 'meeting', 'timeSlot'],
      order: { scheduledAt: 'DESC' },
    });

    return appointments.map(a => this.toResponseDto(a));
  }

  async updateStatus(appointmentId: string, status: AppointmentStatus): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['doctor', 'patient', 'meeting', 'timeSlot'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Update appointment status
    appointment.status = status;
    
    // Update corresponding time slot status
    if (status === AppointmentStatus.COMPLETED) {
      appointment.timeSlot.status = TimeSlotStatus.COMPLETED;
    } else if (status === AppointmentStatus.CANCELLED) {
      appointment.timeSlot.status = TimeSlotStatus.CANCELLED;
    } else if (status === AppointmentStatus.NO_SHOW) {
      appointment.timeSlot.status = TimeSlotStatus.NO_SHOW;
    }

    await this.appointmentRepo.save(appointment);
    await this.timeSlotRepo.save(appointment.timeSlot);

    return this.toResponseDto(appointment);
  }

  private async generateAppointmentNumber(doctorId: number, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointmentsToday = await this.appointmentRepo.count({
      where: {
        doctor: { id: doctorId },
        scheduledAt: Between(startOfDay, endOfDay),
      },
    });

    return appointmentsToday + 1;
  }

  private createScheduledDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours, minutes, 0, 0);
    return scheduledAt;
  }

  // Note: Meeting creation is now handled separately via the meeting API
  // Use POST /meetings/quick or POST /meetings to create Zoom meetings
}
