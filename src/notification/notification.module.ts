import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { Notification } from './entities/notification.entity';
import { FiredNotification } from './entities/fired-notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, FiredNotification]),
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationSchedulerService],
  exports: [NotificationService, NotificationSchedulerService],
})
export class NotificationModule {}
