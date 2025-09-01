import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, LessThan, MoreThan } from 'typeorm';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { UpdateFollowUpDto } from './dto/update-follow-up.dto';
import { FollowUp, FollowUpStatus, FollowUpKind } from './entities/follow-up.entity';

@Injectable()
export class FollowUpService {
  constructor(
    @InjectRepository(FollowUp)
    private readonly followUpRepository: Repository<FollowUp>,
  ) {}

  /**
   * Create a new follow-up
   */
  async create(createFollowUpDto: CreateFollowUpDto): Promise<FollowUp> {
    try {
      const followUp = this.followUpRepository.create({
        ...createFollowUpDto,
        dueAt: new Date(createFollowUpDto.dueAt),
        remindAt1: createFollowUpDto.remindAt1 ? new Date(createFollowUpDto.remindAt1) : undefined,
        remindAt2: createFollowUpDto.remindAt2 ? new Date(createFollowUpDto.remindAt2) : undefined,
        status: 'upcoming',
      });

      return await this.followUpRepository.save(followUp);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to create follow-up: ' + message);
    }
  }

  /**
   * Find all follow-ups with optional filtering
   */
  async findAll(options?: {
    bookId?: string;
    status?: FollowUpStatus;
    kind?: FollowUpKind;
    dueAfter?: Date;
    dueBefore?: Date;
    limit?: number;
    offset?: number;
  }): Promise<FollowUp[]> {
    const where: FindOptionsWhere<FollowUp> = {};

    if (options?.bookId) {
      where.bookId = options.bookId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.kind) {
      where.kind = options.kind;
    }

    if (options?.dueAfter && options?.dueBefore) {
      where.dueAt = Between(options.dueAfter, options.dueBefore);
    } else if (options?.dueAfter) {
      where.dueAt = MoreThan(options.dueAfter);
    } else if (options?.dueBefore) {
      where.dueAt = LessThan(options.dueBefore);
    }

    return await this.followUpRepository.find({
      where,
      order: { dueAt: 'ASC', createdAt: 'DESC' },
      take: options?.limit,
      skip: options?.offset,
      relations: ['book'],
    });
  }

  /**
   * Find one follow-up by ID
   */
  async findOne(id: string): Promise<FollowUp> {
    const followUp = await this.followUpRepository.findOne({
      where: { id },
      relations: ['book'],
    });

    if (!followUp) {
      throw new NotFoundException(`Follow-up with ID ${id} not found`);
    }

    return followUp;
  }

  /**
   * Find follow-ups by book ID
   */
  async findByBookId(bookId: string): Promise<FollowUp[]> {
    return await this.followUpRepository.find({
      where: { bookId },
      order: { dueAt: 'ASC' },
      relations: ['book'],
    });
  }

  /**
   * Find upcoming follow-ups (status = 'upcoming')
   */
  async findUpcoming(limit = 50): Promise<FollowUp[]> {
    return await this.followUpRepository.find({
      where: { status: 'upcoming' },
      order: { dueAt: 'ASC' },
      take: limit,
      relations: ['book'],
    });
  }

  /**
   * Find overdue follow-ups (status = 'upcoming' and dueAt < now)
   */
  async findOverdue(): Promise<FollowUp[]> {
    return await this.followUpRepository.find({
      where: {
        status: 'upcoming',
        dueAt: LessThan(new Date()),
      },
      order: { dueAt: 'ASC' },
      relations: ['book'],
    });
  }

  /**
   * Find follow-ups due for reminders
   */
  async findDueForReminders(): Promise<FollowUp[]> {
    const now = new Date();
    
    return await this.followUpRepository
      .createQueryBuilder('followUp')
      .where('followUp.status = :status', { status: 'upcoming' })
      .andWhere(
        '(followUp.remindAt1 IS NOT NULL AND followUp.remindAt1 <= :now) OR (followUp.remindAt2 IS NOT NULL AND followUp.remindAt2 <= :now)',
        { now }
      )
      .orderBy('followUp.dueAt', 'ASC')
      .getMany();
  }

  /**
   * Update a follow-up
   */
  async update(id: string, updateFollowUpDto: UpdateFollowUpDto): Promise<FollowUp> {
    const followUp = await this.findOne(id);

    // Handle date string conversions properly
    if (updateFollowUpDto.dueAt) {
      followUp.dueAt = new Date(updateFollowUpDto.dueAt);
    }

    if (updateFollowUpDto.remindAt1) {
      followUp.remindAt1 = new Date(updateFollowUpDto.remindAt1);
    }

    if (updateFollowUpDto.remindAt2) {
      followUp.remindAt2 = new Date(updateFollowUpDto.remindAt2);
    }

    // Update other properties directly
    if (updateFollowUpDto.bookId !== undefined) {
      followUp.bookId = updateFollowUpDto.bookId;
    }

    if (updateFollowUpDto.kind !== undefined) {
      followUp.kind = updateFollowUpDto.kind;
    }

    if (updateFollowUpDto.notes !== undefined) {
      followUp.notes = updateFollowUpDto.notes;
    }

    if (updateFollowUpDto.channel !== undefined) {
      followUp.channel = updateFollowUpDto.channel;
    }

    try {
      return await this.followUpRepository.save(followUp);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to update follow-up: ' + message);
    }
  }

  /**
   * Mark follow-up as completed
   */
  async markAsCompleted(id: string): Promise<FollowUp> {
    const followUp = await this.findOne(id);
    followUp.status = 'completed';
    
    return await this.followUpRepository.save(followUp);
  }

  /**
   * Mark follow-up as missed
   */
  async markAsMissed(id: string): Promise<FollowUp> {
    const followUp = await this.findOne(id);
    followUp.status = 'missed';
    
    return await this.followUpRepository.save(followUp);
  }

  /**
   * Mark follow-up as cancelled
   */
  async markAsCancelled(id: string): Promise<FollowUp> {
    const followUp = await this.findOne(id);
    followUp.status = 'cancelled';
    
    return await this.followUpRepository.save(followUp);
  }

  /**
   * Mark overdue follow-ups as missed
   */
  async markOverdueAsMissed(): Promise<number> {
    const result = await this.followUpRepository
      .createQueryBuilder()
      .update(FollowUp)
      .set({ status: 'missed' })
      .where('status = :status AND dueAt < :now', { 
        status: 'upcoming', 
        now: new Date() 
      })
      .execute();

    return result.affected || 0;
  }

  /**
   * Remove/delete a follow-up
   */
  async remove(id: string): Promise<void> {
    const followUp = await this.findOne(id);
    
    try {
      await this.followUpRepository.remove(followUp);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to delete follow-up: ' + message);
    }
  }

  /**
   * Get follow-up statistics for a book
   */
  async getStatistics(bookId?: string): Promise<{
    total: number;
    upcoming: number;
    completed: number;
    missed: number;
    cancelled: number;
    overdue: number;
  }> {
    const where: FindOptionsWhere<FollowUp> = bookId ? { bookId } : {};

    const [total, upcoming, completed, missed, cancelled] = await Promise.all([
      this.followUpRepository.count({ where }),
      this.followUpRepository.count({ where: { ...where, status: 'upcoming' } }),
      this.followUpRepository.count({ where: { ...where, status: 'completed' } }),
      this.followUpRepository.count({ where: { ...where, status: 'missed' } }),
      this.followUpRepository.count({ where: { ...where, status: 'cancelled' } }),
    ]);

    const overdue = await this.followUpRepository.count({
      where: {
        ...where,
        status: 'upcoming',
        dueAt: LessThan(new Date()),
      },
    });

    return {
      total,
      upcoming,
      completed,
      missed,
      cancelled,
      overdue,
    };
  }

  /**
   * Get follow-ups due in the next N days
   */
  async findDueInDays(days: number, bookId?: string): Promise<FollowUp[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const where: FindOptionsWhere<FollowUp> = {
      status: 'upcoming',
      dueAt: Between(now, futureDate),
    };

    if (bookId) {
      where.bookId = bookId;
    }

    return await this.followUpRepository.find({
      where,
      order: { dueAt: 'ASC' },
      relations: ['book'],
    });
  }

  /**
   * Reschedule a follow-up
   */
  async reschedule(id: string, newDueAt: Date, notes?: string): Promise<FollowUp> {
    const followUp = await this.findOne(id);
    
    followUp.dueAt = newDueAt;
    if (notes) {
      followUp.notes = notes;
    }
    
    return await this.followUpRepository.save(followUp);
  }
}
