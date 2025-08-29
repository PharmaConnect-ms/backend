import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ConditionBook } from '@/condition-book/entities/condition-book.entity';

export type FollowUpKind = 'review' | 'lab_review' | 'repeat_rx' | 'procedure';
export type FollowUpStatus = 'upcoming' | 'completed' | 'missed' | 'cancelled';

@Entity('follow_ups')
@Index(['bookId', 'dueAt', 'status'])
export class FollowUp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column() bookId: string;
  @ManyToOne(() => ConditionBook, (b) => b.followUps, { onDelete: 'CASCADE' })
  book: ConditionBook;

  @Column({ type: 'datetime' }) dueAt: Date;
  @Column({ type: 'enum', enum: ['review','lab_review','repeat_rx','procedure'], default: 'review' })
  kind: FollowUpKind;

  @Column({ type: 'text', nullable: true }) notes?: string;
  @Column({ type: 'enum', enum: ['upcoming','completed','missed','cancelled'], default: 'upcoming' })
  status: FollowUpStatus;

  // simple reminder fields (wire them into your FCM/SMS job)
  @Column({ type: 'datetime', nullable: true }) remindAt1?: Date;
  @Column({ type: 'datetime', nullable: true }) remindAt2?: Date;
  @Column({ type: 'enum', enum: ['push','sms','email'], default: 'push' }) channel: 'push'|'sms'|'email';

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
