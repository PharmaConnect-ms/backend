import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Notification, NotificationStatus } from './entities/notification.entity';
import { FiredNotification, FiredNotificationStatus } from './entities/fired-notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(FiredNotification)
    private firedNotificationRepository: Repository<FiredNotification>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      reminderTime: new Date(createNotificationDto.reminderTime),
    });
    return await this.notificationRepository.save(notification);
  }

  async findAll(): Promise<Notification[]> {
    return await this.notificationRepository.find({
      relations: ['user'],
    });
  }

  async findByUserId(userId: number): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId },
      relations: ['user'],
      order: { reminderTime: 'ASC' },
    });
  }

  async findActiveNotifications(): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { status: NotificationStatus.ACTIVE },
      relations: ['user'],
    });
  }

  async findDueNotifications(): Promise<Notification[]> {
    const now = new Date();
    return await this.notificationRepository.find({
      where: {
        status: NotificationStatus.ACTIVE,
        reminderTime: LessThanOrEqual(now),
      },
      relations: ['user'],
    });
  }

  async findExpiredNotifications(): Promise<Notification[]> {
    const now = new Date();
    // Consider notifications expired if they're 24 hours past their reminder time
    const expiryThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return await this.notificationRepository.find({
      where: {
        status: NotificationStatus.ACTIVE,
        reminderTime: LessThanOrEqual(expiryThreshold),
      },
      relations: ['user'],
    });
  }

  async findOne(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    
    return notification;
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    await this.findOne(id); // Verify notification exists
    
    const updateData: Partial<Notification> = {};
    
    if (updateNotificationDto.title) updateData.title = updateNotificationDto.title;
    if (updateNotificationDto.description !== undefined) updateData.description = updateNotificationDto.description;
    if (updateNotificationDto.reminderTime) updateData.reminderTime = new Date(updateNotificationDto.reminderTime);
    if (updateNotificationDto.type) updateData.type = updateNotificationDto.type;
    if (updateNotificationDto.relatedEntityId !== undefined) updateData.relatedEntityId = updateNotificationDto.relatedEntityId;
    if (updateNotificationDto.relatedEntityType) updateData.relatedEntityType = updateNotificationDto.relatedEntityType;
    if (updateNotificationDto.status) updateData.status = updateNotificationDto.status;

    await this.notificationRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationRepository.remove(notification);
  }

  async markAsExpired(notificationIds: number[]): Promise<void> {
    await this.notificationRepository.update(
      notificationIds,
      { status: NotificationStatus.EXPIRED }
    );
  }

  async markAsFired(notificationId: number): Promise<void> {
    await this.notificationRepository.update(
      notificationId,
      { status: NotificationStatus.FIRED }
    );
  }

  async createFiredNotification(
    notification: Notification,
    status: FiredNotificationStatus = FiredNotificationStatus.SENT,
    errorMessage?: string
  ): Promise<FiredNotification> {
    const firedNotification = this.firedNotificationRepository.create({
      notificationId: notification.id,
      userId: notification.userId,
      title: notification.title,
      description: notification.description,
      scheduledTime: notification.reminderTime,
      firedAt: new Date(),
      status,
      errorMessage,
      metadata: {
        type: notification.type,
        relatedEntityId: notification.relatedEntityId,
        relatedEntityType: notification.relatedEntityType,
      },
    });

    return await this.firedNotificationRepository.save(firedNotification);
  }

  async getFiredNotificationsByUserId(userId: number): Promise<FiredNotification[]> {
    return await this.firedNotificationRepository.find({
      where: { userId },
      relations: ['notification', 'user'],
      order: { firedAt: 'DESC' },
    });
  }

  async getFiredNotificationsByNotificationId(notificationId: number): Promise<FiredNotification[]> {
    return await this.firedNotificationRepository.find({
      where: { notificationId },
      relations: ['notification', 'user'],
      order: { firedAt: 'DESC' },
    });
  }

  async updateFiredNotificationStatus(
    id: number, 
    status: FiredNotificationStatus
  ): Promise<FiredNotification | null> {
    await this.firedNotificationRepository.update(id, { status });
    return await this.firedNotificationRepository.findOne({
      where: { id },
      relations: ['notification', 'user'],
    });
  }
}
