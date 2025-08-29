import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TimeSlot } from './entities/time-slot.entity';
import { TimeSlotStatus, AppointmentData } from './types';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { 
  GenerateTimeSlotsDto, 
  UpdateTimeSlotStatusDto, 
  TimeSlotResponseDto 
} from './dto/time-slot.dto';

@Injectable()
export class TimeSlotService {
  constructor(
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepo: Repository<TimeSlot>,

    @InjectRepository(DoctorSchedule)
    private readonly doctorScheduleRepo: Repository<DoctorSchedule>,
  ) {}

  async generateTimeSlots(generateDto: GenerateTimeSlotsDto): Promise<TimeSlot[]> {
    const doctorSchedule = await this.doctorScheduleRepo.findOne({
      where: { id: generateDto.doctorScheduleId },
      relations: ['doctor'],
    });

    if (!doctorSchedule) {
      throw new NotFoundException('Doctor schedule not found');
    }

    if (!doctorSchedule.isActive) {
      throw new BadRequestException('Doctor schedule is not active');
    }

    // For date-specific schedules, we generate slots only for the specific date in the schedule
    const scheduleDate = doctorSchedule.date;
    const startDate = new Date(generateDto.startDate);
    const endDate = new Date(generateDto.endDate);

    // Check if the schedule's date falls within the requested range
    if (scheduleDate < startDate || scheduleDate > endDate) {
      throw new BadRequestException(
        `Doctor schedule date (${scheduleDate.toISOString().split('T')[0]}) is outside the requested date range`
      );
    }

    // Check if slots already exist for this schedule
    const existingSlots = await this.timeSlotRepo.find({
      where: {
        doctorSchedule: { id: doctorSchedule.id },
      },
    });

    if (existingSlots.length > 0) {
      throw new BadRequestException('Time slots already exist for this doctor schedule');
    }

    // Generate time slots for the specific date
    const slots = this.generateSlotsForDate(scheduleDate, doctorSchedule);
    const generatedSlots: TimeSlot[] = [];

    for (const slot of slots) {
      const savedSlot = await this.timeSlotRepo.save(slot);
      generatedSlots.push(savedSlot);
    }

    return generatedSlots;
  }

  async generateTimeSlotsForSchedule(doctorScheduleId: string): Promise<TimeSlot[]> {
    const doctorSchedule = await this.doctorScheduleRepo.findOne({
      where: { id: doctorScheduleId },
      relations: ['doctor'],
    });

    if (!doctorSchedule) {
      throw new NotFoundException('Doctor schedule not found');
    }

    if (!doctorSchedule.isActive) {
      throw new BadRequestException('Doctor schedule is not active');
    }

    // Check if slots already exist for this schedule
    const existingSlots = await this.timeSlotRepo.find({
      where: {
        doctorSchedule: { id: doctorSchedule.id },
      },
    });

    if (existingSlots.length > 0) {
      throw new BadRequestException('Time slots already exist for this doctor schedule');
    }

    // Generate time slots for the schedule's specific date
    const slots = this.generateSlotsForDate(doctorSchedule.date, doctorSchedule);
    const generatedSlots: TimeSlot[] = [];

    for (const slot of slots) {
      const savedSlot = await this.timeSlotRepo.save(slot);
      generatedSlots.push(savedSlot);
    }

    return generatedSlots;
  }

  private generateSlotsForDate(date: Date, doctorSchedule: DoctorSchedule): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = doctorSchedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = doctorSchedule.endTime.split(':').map(Number);

    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    const slotDuration = doctorSchedule.slotDurationMinutes;

    for (let currentTime = startTimeInMinutes; currentTime < endTimeInMinutes; currentTime += slotDuration) {
      const slotEndTime = currentTime + slotDuration;
      
      // Don't create slot if it would exceed the end time
      if (slotEndTime > endTimeInMinutes) {
        break;
      }

      const startHour = Math.floor(currentTime / 60);
      const startMinute = currentTime % 60;
      const endHour = Math.floor(slotEndTime / 60);
      const endMinute = slotEndTime % 60;

      const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
      const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

      const slot = this.timeSlotRepo.create({
        doctorSchedule,
        date,
        startTime: startTimeStr,
        endTime: endTimeStr,
        status: TimeSlotStatus.AVAILABLE,
      });

      slots.push(slot);
    }

    return slots;
  }

  async findAvailableSlots(
    doctorId: number,
    startDate?: string,
    endDate?: string
  ): Promise<TimeSlotResponseDto[]> {
    const whereCondition: Record<string, any> = {
      status: TimeSlotStatus.AVAILABLE,
      doctorSchedule: {
        doctor: { id: doctorId },
        isActive: true,
      },
    };

    if (startDate && endDate) {
      whereCondition.date = Between(new Date(startDate), new Date(endDate));
    }

    const slots = await this.timeSlotRepo.find({
      where: whereCondition,
      relations: ['doctorSchedule', 'doctorSchedule.doctor'],
      order: {
        date: 'ASC',
        startTime: 'ASC',
      },
    });

    return slots.map(slot => this.toResponseDto(slot));
  }

  async findByDoctor(doctorId: number): Promise<TimeSlotResponseDto[]> {
    const slots = await this.timeSlotRepo.find({
      where: {
        doctorSchedule: {
          doctor: { id: doctorId },
        },
      },
      relations: ['doctorSchedule', 'doctorSchedule.doctor'],
      order: {
        date: 'ASC',
        startTime: 'ASC',
      },
    });

    // For each slot, check if there's an associated appointment
    const slotsWithAppointments = await Promise.all(
      slots.map(async (slot) => {
        const appointment = await this.timeSlotRepo.manager.findOne('Appointment', {
          where: { timeSlot: { id: slot.id } },
          relations: ['patient'],
        }) as {
          id: string;
          appointmentNo: number;
          type: string;
          patient: {
            id: number;
            username: string;
          };
        } | null;
        return { ...slot, appointment };
      })
    );

    return slotsWithAppointments.map(slot => this.toResponseDto(slot));
  }

  async findOne(id: string): Promise<TimeSlot> {
    const slot = await this.timeSlotRepo.findOne({
      where: { id },
      relations: ['doctorSchedule', 'doctorSchedule.doctor'],
    });

    if (!slot) {
      throw new NotFoundException('Time slot not found');
    }

    return slot;
  }

  async updateStatus(id: string, updateDto: UpdateTimeSlotStatusDto): Promise<TimeSlot> {
    const slot = await this.findOne(id);

    slot.status = updateDto.status;
    return await this.timeSlotRepo.save(slot);
  }

  private toResponseDto(slot: TimeSlot & { appointment?: AppointmentData | null }): TimeSlotResponseDto {
    return {
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      doctorSchedule: {
        id: slot.doctorSchedule.id,
        doctor: {
          id: slot.doctorSchedule.doctor.id,
          username: slot.doctorSchedule.doctor.username,
        },
        date: slot.doctorSchedule.date,
        slotDurationMinutes: slot.doctorSchedule.slotDurationMinutes,
      },
      appointment: slot.appointment ? {
        id: slot.appointment.id,
        appointmentNo: slot.appointment.appointmentNo,
        type: slot.appointment.type,
        patient: {
          id: slot.appointment.patient.id,
          username: slot.appointment.patient.username,
        },
      } : undefined,
    };
  }
}
