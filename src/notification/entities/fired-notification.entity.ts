import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Notification } from './notification.entity';
import { User } from '../../users/user.entity';

export enum FiredNotificationStatus {
  SENT = 'sent',
  FAILED = 'failed',
  ACKNOWLEDGED = 'acknowledged',
}

@Entity('fired_notifications')
export class FiredNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Notification, (notification) => notification.id, { 
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'notificationId' })
  notification: Notification;

  @Column({ type: 'int' })
  notificationId: number;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'datetime' })
  scheduledTime: Date;

  @Column({ type: 'datetime' })
  firedAt: Date;

  @Column({
    type: 'enum',
    enum: FiredNotificationStatus,
    default: FiredNotificationStatus.SENT,
  })
  status: FiredNotificationStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
