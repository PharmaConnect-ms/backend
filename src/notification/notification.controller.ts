import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly schedulerService: NotificationSchedulerService,
  ) {}

  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return await this.notificationService.create(createNotificationDto);
  }

  @Get()
  async findAll() {
    return await this.notificationService.findAll();
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return await this.notificationService.findByUserId(userId);
  }

  @Get('active')
  async findActiveNotifications() {
    return await this.notificationService.findActiveNotifications();
  }

  @Get('due')
  async findDueNotifications() {
    return await this.notificationService.findDueNotifications();
  }

  @Get('expired')
  async findExpiredNotifications() {
    return await this.notificationService.findExpiredNotifications();
  }

  @Get('fired/user/:userId')
  async getFiredNotificationsByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return await this.notificationService.getFiredNotificationsByUserId(userId);
  }

  @Get('fired/notification/:notificationId')
  async getFiredNotificationsByNotificationId(
    @Param('notificationId', ParseIntPipe) notificationId: number
  ) {
    return await this.notificationService.getFiredNotificationsByNotificationId(notificationId);
  }

  @Get('scheduler/stats')
  async getSchedulerStats() {
    return await this.schedulerService.getSchedulerStats();
  }

  @Post('scheduler/trigger')
  async triggerScheduler() {
    await this.schedulerService.triggerNotificationProcessing();
    return { message: 'Notification processing triggered successfully' };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.notificationService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return await this.notificationService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.notificationService.remove(id);
    return { message: 'Notification deleted successfully' };
  }
}
