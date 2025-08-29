import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DoctorSchedule } from './doctor-schedule.entity';
import { TimeSlotStatus } from '../types';

@Index(['doctorSchedule', 'date', 'startTime'], { unique: true })
@Entity()
export class TimeSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('DoctorSchedule', 'timeSlots', { eager: true })
  doctorSchedule: DoctorSchedule;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time' })
  startTime: string; // Format: HH:MM

  @Column({ type: 'time' })
  endTime: string; // Format: HH:MM

  @Column({ type: 'enum', enum: TimeSlotStatus, default: TimeSlotStatus.AVAILABLE })
  status: TimeSlotStatus;

  // Note: We'll use a separate relation in Appointment entity instead of here
  // to avoid circular dependency issues

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
