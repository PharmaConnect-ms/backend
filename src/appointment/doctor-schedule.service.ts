import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { CreateDoctorScheduleDto, UpdateDoctorScheduleDto } from './dto/doctor-schedule.dto';
import { User } from '@/users/user.entity';
import { TimeSlotService } from './time-slot.service';

@Injectable()
export class DoctorScheduleService {
  constructor(
    @InjectRepository(DoctorSchedule)
    private readonly doctorScheduleRepo: Repository<DoctorSchedule>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly timeSlotService: TimeSlotService,
  ) {}

  async create(createDto: CreateDoctorScheduleDto): Promise<DoctorSchedule> {
    // Verify doctor exists and has doctor role
    const doctor = await this.userRepo.findOne({ 
      where: { id: createDto.doctorId } 
    });
    
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (doctor.role !== 'doctor') {
      throw new BadRequestException('User is not a doctor');
    }

    // Parse and validate the date
    const scheduleDate = new Date(createDto.date);
    if (isNaN(scheduleDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    // Validate time format and logic
    if (!this.isValidTimeFormat(createDto.startTime) || !this.isValidTimeFormat(createDto.endTime)) {
      throw new BadRequestException('Invalid time format. Use HH:MM format');
    }

    if (createDto.startTime >= createDto.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    if (createDto.slotDurationMinutes <= 0 || createDto.slotDurationMinutes > 480) {
      throw new BadRequestException('Slot duration must be between 1 and 480 minutes');
    }

    // Check for overlapping schedules for this doctor on this specific date
    const existingSchedules = await this.doctorScheduleRepo.find({
      where: {
        doctor: { id: createDto.doctorId },
        date: scheduleDate,
      },
    });

    // Check for time overlap with existing schedules
    const hasOverlap = existingSchedules.some(existing => {
      return this.isTimeRangeOverlapping(
        createDto.startTime, createDto.endTime,
        existing.startTime, existing.endTime
      );
    });

    if (hasOverlap) {
      throw new BadRequestException(
        `Schedule time range overlaps with existing schedule for ${createDto.date}. Please choose a different time range.`
      );
    }

    const schedule = this.doctorScheduleRepo.create({
      doctor,
      date: scheduleDate,
      startTime: createDto.startTime,
      endTime: createDto.endTime,
      slotDurationMinutes: createDto.slotDurationMinutes,
      isActive: createDto.isActive ?? true,
    });

    const savedSchedule = await this.doctorScheduleRepo.save(schedule);

    // Automatically generate time slots for the created schedule
    try {
      await this.timeSlotService.createTimeSlotsForNewSchedule(savedSchedule.id);
    } catch (error) {
      // If time slot generation fails, log the error but don't fail the schedule creation
      console.error('Failed to generate time slots for schedule:', savedSchedule.id, error instanceof Error ? error.message : 'Unknown error');
    }

    return savedSchedule;
  }

  async findAll(): Promise<DoctorSchedule[]> {
    return await this.doctorScheduleRepo.find({
      relations: ['doctor'],
      order: {
        doctor: { username: 'ASC' },
        date: 'ASC',
      },
    });
  }

  async findByDoctor(doctorId: number, startDate?: string, endDate?: string): Promise<DoctorSchedule[]> {
    const whereCondition: Record<string, any> = {
      doctor: { id: doctorId }
    };

    // Add date range filtering if provided
    if (startDate && endDate) {
      whereCondition.date = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereCondition.date = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereCondition.date = LessThanOrEqual(new Date(endDate));
    }

    return await this.doctorScheduleRepo.find({
      where: whereCondition,
      relations: ['doctor'],
      order: { date: 'ASC' },
    });
  }

  async findByDateRange(startDate: string, endDate: string): Promise<DoctorSchedule[]> {
    return await this.doctorScheduleRepo.find({
      where: {
        date: Between(new Date(startDate), new Date(endDate)),
        isActive: true,
      },
      relations: ['doctor'],
      order: { date: 'ASC', doctor: { username: 'ASC' } },
    });
  }

  async findOne(id: string): Promise<DoctorSchedule> {
    const schedule = await this.doctorScheduleRepo.findOne({
      where: { id },
      relations: ['doctor'],
    });

    if (!schedule) {
      throw new NotFoundException('Doctor schedule not found');
    }

    return schedule;
  }

  async update(id: string, updateDto: UpdateDoctorScheduleDto): Promise<DoctorSchedule> {
    const schedule = await this.findOne(id);

    let scheduleDate = schedule.date;
    if (updateDto.date) {
      const newDate = new Date(updateDto.date);
      if (isNaN(newDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }
      scheduleDate = newDate;
    }

    if (updateDto.startTime && !this.isValidTimeFormat(updateDto.startTime)) {
      throw new BadRequestException('Invalid start time format. Use HH:MM format');
    }

    if (updateDto.endTime && !this.isValidTimeFormat(updateDto.endTime)) {
      throw new BadRequestException('Invalid end time format. Use HH:MM format');
    }

    const startTime = updateDto.startTime || schedule.startTime;
    const endTime = updateDto.endTime || schedule.endTime;

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    if (updateDto.slotDurationMinutes && (updateDto.slotDurationMinutes <= 0 || updateDto.slotDurationMinutes > 480)) {
      throw new BadRequestException('Slot duration must be between 1 and 480 minutes');
    }

    // Check for overlapping schedules (excluding the current schedule being updated)
    const existingSchedules = await this.doctorScheduleRepo.find({
      where: {
        doctor: { id: schedule.doctor.id },
        date: scheduleDate,
      },
    });

    // Filter out the current schedule being updated
    const otherSchedules = existingSchedules.filter(existing => existing.id !== id);

    // Check for time overlap with other existing schedules
    const hasOverlap = otherSchedules.some(existing => {
      return this.isTimeRangeOverlapping(
        startTime, endTime,
        existing.startTime, existing.endTime
      );
    });

    if (hasOverlap) {
      throw new BadRequestException(
        `Updated schedule time range overlaps with existing schedule for ${scheduleDate.toISOString().split('T')[0]}. Please choose a different time range.`
      );
    }

    Object.assign(schedule, updateDto);
    if (updateDto.date) {
      schedule.date = scheduleDate;
    }
    
    const updatedSchedule = await this.doctorScheduleRepo.save(schedule);

    // If the schedule is now active and has time/date changes, regenerate time slots
    if (updatedSchedule.isActive && (updateDto.date || updateDto.startTime || updateDto.endTime || updateDto.slotDurationMinutes)) {
      try {
        // Note: This will handle existing slots appropriately (return them if they exist)
        await this.timeSlotService.createTimeSlotsForNewSchedule(updatedSchedule.id);
      } catch (error) {
        console.error('Failed to regenerate time slots for updated schedule:', updatedSchedule.id, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    return updatedSchedule;
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    await this.doctorScheduleRepo.remove(schedule);
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Check if two time ranges overlap
   * @param start1 Start time of first range (HH:MM)
   * @param end1 End time of first range (HH:MM)
   * @param start2 Start time of second range (HH:MM)
   * @param end2 End time of second range (HH:MM)
   * @returns true if ranges overlap, false otherwise
   */
  private isTimeRangeOverlapping(
    start1: string, 
    end1: string, 
    start2: string, 
    end2: string
  ): boolean {
    // Convert time strings to minutes for easier comparison
    const start1Minutes = this.timeToMinutes(start1);
    const end1Minutes = this.timeToMinutes(end1);
    const start2Minutes = this.timeToMinutes(start2);
    const end2Minutes = this.timeToMinutes(end2);

    // Check if ranges overlap
    // Ranges overlap if: start1 < end2 AND start2 < end1
    return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
  }

  /**
   * Convert time string (HH:MM) to minutes since midnight
   * @param time Time string in HH:MM format
   * @returns Minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
