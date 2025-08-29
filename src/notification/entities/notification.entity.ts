import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum NotificationStatus {
  ACTIVE = 'active',
  FIRED = 'fired',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum NotificationType {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  MEDICATION_REMINDER = 'medication_reminder',
  FOLLOW_UP_REMINDER = 'follow_up_reminder',
  GENERAL_REMINDER = 'general_reminder',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'datetime' })
  reminderTime: Date;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.ACTIVE,
  })
  status: NotificationStatus;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.GENERAL_REMINDER,
  })
  type: NotificationType;

  @Column({ type: 'int', nullable: true })
  relatedEntityId: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  relatedEntityType: string;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
