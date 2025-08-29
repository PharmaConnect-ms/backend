import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BookEntry } from '@/book-entry/entities/book-entry.entity';
import { FollowUp } from '@/follow-up/entities/follow-up.entity';

export type BookStatus = 'active' | 'remission' | 'closed';

@Entity('condition_books')
export class ConditionBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column() patientId: string;          
  @Column() primaryDoctorId: string;    

  @Column() title: string;              // e.g., "Type 2 Diabetes"

  @Column({ type: 'enum', enum: ['active','remission','closed'], default: 'active' })
  status: BookStatus;

  @Column({ type: 'date', nullable: true }) onsetDate?: string; // YYYY-MM-DD
  @Column({ nullable: true }) severity?: string;                // e.g., mild/moderate/severe
  @Column({ type: 'text', nullable: true }) allergies?: string; // comma separated or JSON if you prefer

  // Care plan metadata
  @Column({ type: 'json', nullable: true }) goals?: any;        // [{goal, targetDate}]
  @Column({ type: 'text', nullable: true }) instructions?: string; // sanitized HTML/Delta
  @Column({ type: 'int', default: 30 }) reviewIntervalDays: number;

  @OneToMany(() => BookEntry, (e) => e.book, { cascade: true })
  entries: BookEntry[];

  @OneToMany(() => FollowUp, (f) => f.book, { cascade: true })
  followUps: FollowUp[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
