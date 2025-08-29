import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '@/users/user.entity';
import { TimeSlot } from './time-slot.entity';

@Index(['doctor', 'date'], { unique: true }) // Prevent duplicate schedules for same doctor on same date
@Entity()
export class DoctorSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  doctor: User;

  @Column({ type: 'date' })
  date: Date; // Specific date instead of day of week

  @Column({ type: 'time' })
  startTime: string; // Format: HH:MM

  @Column({ type: 'time' })
  endTime: string; // Format: HH:MM

  @Column({ type: 'int' })
  slotDurationMinutes: number; // e.g., 30 minutes per patient

  @Column({ default: true })
  isActive: boolean;

  @OneToMany('TimeSlot', 'doctorSchedule')
  timeSlots: TimeSlot[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
