import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ConditionBook } from '@/condition-book/entities/condition-book.entity';

export type EntryType = 'visit' | 'note' | 'lab' | 'vitals' | 'med_change' | 'imaging' | 'attachment';

@Entity('book_entries')
@Index(['bookId', 'entryDate'])
export class BookEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column() bookId: string;
  @ManyToOne(() => ConditionBook, (b) => b.entries, { onDelete: 'CASCADE' })
  book: ConditionBook;

  @Column({ type: 'datetime' }) entryDate: Date;
  @Column({ type: 'enum', enum: ['visit','note','lab','vitals','med_change','imaging','attachment'] })
  type: EntryType;

  @Column({ length: 280 }) summary: string;               // short line shown in timeline
  @Column({ type: 'text', nullable: true }) details?: string; // rich text (sanitized) / JSON string

  @Column({ nullable: true }) attachedFileUrl?: string;    // S3/GCS URL with signed access
  @Column({ nullable: true }) tags?: string;               // CSV tags (e.g., "bp,dm,review")

  // Optional cross-links
  @Column({ nullable: true }) appointmentId?: string;      // FK → appointments.id
  @Column({ nullable: true }) prescriptionId?: string;     // FK → prescriptions.id

  @Column({ default: 'doctor' }) uploadedBy: 'doctor' | 'patient' | 'pharmacist' | 'admin';

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
