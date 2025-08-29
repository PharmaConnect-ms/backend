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

@Injectable()
export class DoctorScheduleService {
  constructor(
    @InjectRepository(DoctorSchedule)
    private readonly doctorScheduleRepo: Repository<DoctorSchedule>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

    // Check if schedule already exists for this doctor on this specific date
    const existingSchedule = await this.doctorScheduleRepo.findOne({
      where: {
        doctor: { id: createDto.doctorId },
        date: scheduleDate,
      },
    });

    if (existingSchedule) {
      throw new BadRequestException(
        `Schedule already exists for ${createDto.date}. Use update instead.`
      );
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

    const schedule = this.doctorScheduleRepo.create({
      doctor,
      date: scheduleDate,
      startTime: createDto.startTime,
      endTime: createDto.endTime,
      slotDurationMinutes: createDto.slotDurationMinutes,
      isActive: createDto.isActive ?? true,
    });

    return await this.doctorScheduleRepo.save(schedule);
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

    if (updateDto.date) {
      const newDate = new Date(updateDto.date);
      if (isNaN(newDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }
      schedule.date = newDate;
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

    Object.assign(schedule, updateDto);
    return await this.doctorScheduleRepo.save(schedule);
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    await this.doctorScheduleRepo.remove(schedule);
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}
