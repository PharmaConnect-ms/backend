import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Appointment } from '@/appointment/entities/appointment.entity';

@Entity()
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Appointment, { cascade: true })
  @JoinColumn()
  appointment: Appointment;

  @Column()
  roomLink: string;

  @Column({ default: 'scheduled' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  meetingId: string; 
}
