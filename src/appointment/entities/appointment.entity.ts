import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '@/users/user.entity';
import { Meeting } from '@/meeting/entities/meeting.entity';

export enum AppointmentType {
  PHYSICAL = 'physical',
  ONLINE = 'online',
}

@Index(['doctor', 'scheduledAt']) // For querying efficiency
@Index(['doctor', 'scheduledAt', 'appointmentNo'], { unique: true }) // Prevent duplicate numbers per day per doctor
@Entity()
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  doctor: User;

  @ManyToOne(() => User)
  patient: User;

  @Column({ type: 'enum', enum: AppointmentType })
  type: AppointmentType;

  @Column()
  scheduledAt: Date;

  @Column({ default: 'pending' })
  status: string;

  @OneToOne(() => Meeting, { nullable: true })
  @JoinColumn()
  meeting?: Meeting;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  appointmentNo: number;
}
