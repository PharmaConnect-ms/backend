import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { FamilyMember } from './family-member.entity';

export enum CareTaskType {
  MEDICATION = 'medication',
  FEEDING = 'feeding',
  EXERCISE = 'exercise',
  CHECKUP = 'checkup',
  THERAPY = 'therapy',
  HYGIENE = 'hygiene',
  OTHER = 'other',
}

export enum CareFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  AS_NEEDED = 'as_needed',
}

@Entity('care_profiles')
export class CareProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: CareTaskType,
  })
  taskType: CareTaskType;

  @Column({
    type: 'enum',
    enum: CareFrequency,
  })
  frequency: CareFrequency;

  @Column({ type: 'time', nullable: true })
  scheduledTime: string;

  @Column({ type: 'simple-array', nullable: true })
  daysOfWeek: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @ManyToOne(() => FamilyMember, (familyMember) => familyMember.careProfiles)
  @JoinColumn({ name: 'family_member_id' })
  familyMember: FamilyMember;

  @Column({ name: 'family_member_id' })
  familyMemberId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
