import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '@/users/user.entity';
import { Meeting } from '@/meeting/entities/meeting.entity';
import { TimeSlot } from './time-slot.entity';

export enum AppointmentType {
  PHYSICAL = 'physical',
  ONLINE = 'online',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Index(['doctor', 'scheduledAt']) // For querying efficiency
@Index(['doctor', 'scheduledAt', 'appointmentNo'], { unique: true }) // Prevent duplicate numbers per day per doctor
@Entity()
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  doctor: User;

  @ManyToOne(() => User, { eager: true })
  patient: User;

  @OneToOne(() => TimeSlot, { eager: true })
  @JoinColumn()
  timeSlot: TimeSlot;

  @Column({ type: 'enum', enum: AppointmentType })
  type: AppointmentType;

  @Column()
  scheduledAt: Date;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus;

  @OneToOne(() => Meeting, { nullable: true })
  @JoinColumn()
  meeting?: Meeting;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  appointmentNo: number;
}
