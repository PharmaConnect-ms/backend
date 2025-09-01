import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Appointment } from '@/appointment/entities/appointment.entity';

@Entity()
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Appointment, { cascade: true, nullable: true })
  @JoinColumn()
  appointment?: Appointment;

  @Column({ name: 'zoom_meeting_id' })
  zoomMeetingId: string;

  @Column({ name: 'join_url', type: 'text' })
  joinUrl: string;

  @Column({ name: 'start_url', type: 'text' })
  startUrl: string;

  @Column({ nullable: true })
  password: string;

  @Column({ default: 'scheduled' })
  status: string;

  @Column({ nullable: true })
  topic: string;

  @Column({ type: 'datetime', nullable: true, name: 'start_time' })
  startTime: Date;

  @Column({ default: 60 })
  duration: number;

  @Column({ nullable: true })
  agenda: string;

  @Column({ name: 'host_email' })
  hostEmail: string;

  @Column({ name: 'meeting_type', default: 'appointment' })
  meetingType: string; // 'appointment' or 'standalone'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
