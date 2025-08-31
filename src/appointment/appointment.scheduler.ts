import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorSchedule } from './entities/doctor-schedule.entity';

@Injectable()
export class AppointmentScheduler {
  private readonly logger = new Logger(AppointmentScheduler.name);

  constructor(
    @InjectRepository(DoctorSchedule)
    private readonly doctorScheduleRepo: Repository<DoctorSchedule>,
  ) {}

  // Runs every 30 minutes to check and deactivate expired doctor schedules
  @Cron('0 */30 * * * *', {
    name: 'deactivate-expired-schedules',
  })
  async handleDeactivateExpiredSchedules() {
    this.logger.log('Running scheduled task: Deactivating expired doctor schedules');

    try {
      const now = new Date();
      const currentTime = this.getCurrentTimeString(now);
      const currentDate = this.getCurrentDateString(now);

      // Find all active schedules where the date is before today
      // OR the date is today but the end time has passed
      const expiredSchedules = await this.doctorScheduleRepo
        .createQueryBuilder('schedule')
        .where('schedule.isActive = :isActive', { isActive: true })
        .andWhere(
          '(schedule.date < :currentDate OR (schedule.date = :currentDate AND schedule.endTime < :currentTime))',
          {
            currentDate,
            currentTime,
          }
        )
        .getMany();

      if (expiredSchedules.length === 0) {
        this.logger.log('No expired schedules found');
        return;
      }

      // Deactivate expired schedules
      const scheduleIds = expiredSchedules.map(schedule => schedule.id);
      
      await this.doctorScheduleRepo
        .createQueryBuilder()
        .update(DoctorSchedule)
        .set({ isActive: false })
        .where('id IN (:...ids)', { ids: scheduleIds })
        .execute();

      this.logger.log(
        `Successfully deactivated ${expiredSchedules.length} expired doctor schedules`,
        {
          deactivatedSchedules: expiredSchedules.map(schedule => ({
            id: schedule.id,
            doctorId: schedule.doctor.id,
            doctorUsername: schedule.doctor.username,
            date: schedule.date,
            timeRange: `${schedule.startTime}-${schedule.endTime}`,
          })),
        }
      );
    } catch (error) {
      this.logger.error(
        'Failed to deactivate expired doctor schedules', 
        error instanceof Error ? error.stack : String(error)
      );
    }
  }

  // Get current time in HH:MM format
  private getCurrentTimeString(date: Date): string {
    return date.toTimeString().slice(0, 5); // HH:MM format
  }

  // Get current date in YYYY-MM-DD format
  private getCurrentDateString(date: Date): string {
    return date.toISOString().slice(0, 10); // YYYY-MM-DD format
  }

  // Manual method to trigger schedule deactivation (useful for testing)
  async manuallyDeactivateExpiredSchedules(): Promise<number> {
    await this.handleDeactivateExpiredSchedules();
    
    // Return count of deactivated schedules
    const now = new Date();
    const currentTime = this.getCurrentTimeString(now);
    const currentDate = this.getCurrentDateString(now);

    const expiredCount = await this.doctorScheduleRepo
      .createQueryBuilder('schedule')
      .where('schedule.isActive = :isActive', { isActive: false })
      .andWhere(
        '(schedule.date < :currentDate OR (schedule.date = :currentDate AND schedule.endTime < :currentTime))',
        {
          currentDate,
          currentTime,
        }
      )
      .getCount();

    return expiredCount;
  }
}