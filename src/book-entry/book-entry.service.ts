import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, Like } from 'typeorm';
import { CreateBookEntryDto } from './dto/create-book-entry.dto';
import { UpdateBookEntryDto } from './dto/update-book-entry.dto';
import { BookEntry, EntryType } from './entities/book-entry.entity';

@Injectable()
export class BookEntryService {
  constructor(
    @InjectRepository(BookEntry)
    private readonly bookEntryRepository: Repository<BookEntry>,
  ) {}

  /**
   * Create a new book entry
   */
  async create(createBookEntryDto: CreateBookEntryDto): Promise<BookEntry> {
    try {
      const bookEntry = this.bookEntryRepository.create({
        ...createBookEntryDto,
        entryDate: new Date(createBookEntryDto.entryDate),
        uploadedBy: createBookEntryDto.uploadedBy || 'doctor',
      });

      return await this.bookEntryRepository.save(bookEntry);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to create book entry: ' + message);
    }
  }

  /**
   * Find all book entries with optional filtering
   */
  async findAll(options?: {
    bookId?: string;
    type?: EntryType;
    uploadedBy?: 'doctor' | 'patient' | 'pharmacist' | 'admin';
    entryAfter?: Date;
    entryBefore?: Date;
    tags?: string[];
    appointmentId?: string;
    prescriptionId?: string;
    limit?: number;
    offset?: number;
    searchTerm?: string;
  }): Promise<BookEntry[]> {
    const queryBuilder = this.bookEntryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.book', 'book');

    // Apply filters
    if (options?.bookId) {
      queryBuilder.andWhere('entry.bookId = :bookId', { bookId: options.bookId });
    }

    if (options?.type) {
      queryBuilder.andWhere('entry.type = :type', { type: options.type });
    }

    if (options?.uploadedBy) {
      queryBuilder.andWhere('entry.uploadedBy = :uploadedBy', { uploadedBy: options.uploadedBy });
    }

    if (options?.appointmentId) {
      queryBuilder.andWhere('entry.appointmentId = :appointmentId', { appointmentId: options.appointmentId });
    }

    if (options?.prescriptionId) {
      queryBuilder.andWhere('entry.prescriptionId = :prescriptionId', { prescriptionId: options.prescriptionId });
    }

    if (options?.entryAfter && options?.entryBefore) {
      queryBuilder.andWhere('entry.entryDate BETWEEN :after AND :before', {
        after: options.entryAfter,
        before: options.entryBefore,
      });
    } else if (options?.entryAfter) {
      queryBuilder.andWhere('entry.entryDate >= :after', { after: options.entryAfter });
    } else if (options?.entryBefore) {
      queryBuilder.andWhere('entry.entryDate <= :before', { before: options.entryBefore });
    }

    // Search in summary and details
    if (options?.searchTerm) {
      queryBuilder.andWhere(
        '(entry.summary LIKE :searchTerm OR entry.details LIKE :searchTerm)',
        { searchTerm: `%${options.searchTerm}%` }
      );
    }

    // Filter by tags if provided
    if (options?.tags && options.tags.length > 0) {
      const tagConditions = options.tags.map((tag, index) => {
        queryBuilder.setParameter(`tag${index}`, `%${tag}%`);
        return `entry.tags LIKE :tag${index}`;
      });
      queryBuilder.andWhere(`(${tagConditions.join(' OR ')})`);
    }

    // Apply pagination
    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }

    if (options?.offset) {
      queryBuilder.offset(options.offset);
    }

    // Order by entry date (newest first)
    queryBuilder.orderBy('entry.entryDate', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Find one book entry by ID
   */
  async findOne(id: string): Promise<BookEntry> {
    const bookEntry = await this.bookEntryRepository.findOne({
      where: { id },
      relations: ['book'],
    });

    if (!bookEntry) {
      throw new NotFoundException(`Book entry with ID ${id} not found`);
    }

    return bookEntry;
  }

  /**
   * Find entries by book ID
   */
  async findByBookId(bookId: string, limit = 50, offset = 0): Promise<BookEntry[]> {
    return await this.bookEntryRepository.find({
      where: { bookId },
      order: { entryDate: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['book'],
    });
  }

  /**
   * Find entries by type
   */
  async findByType(type: EntryType, bookId?: string, limit = 50): Promise<BookEntry[]> {
    const where: FindOptionsWhere<BookEntry> = { type };
    if (bookId) {
      where.bookId = bookId;
    }

    return await this.bookEntryRepository.find({
      where,
      order: { entryDate: 'DESC' },
      take: limit,
      relations: ['book'],
    });
  }

  /**
   * Find entries by appointment ID
   */
  async findByAppointmentId(appointmentId: string): Promise<BookEntry[]> {
    return await this.bookEntryRepository.find({
      where: { appointmentId },
      order: { entryDate: 'DESC' },
      relations: ['book'],
    });
  }

  /**
   * Find entries by prescription ID
   */
  async findByPrescriptionId(prescriptionId: string): Promise<BookEntry[]> {
    return await this.bookEntryRepository.find({
      where: { prescriptionId },
      order: { entryDate: 'DESC' },
      relations: ['book'],
    });
  }

  /**
   * Search entries by text in summary and details
   */
  async searchEntries(searchTerm: string, bookId?: string, limit = 50): Promise<BookEntry[]> {
    const queryBuilder = this.bookEntryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.book', 'book')
      .where('(entry.summary LIKE :searchTerm OR entry.details LIKE :searchTerm)', {
        searchTerm: `%${searchTerm}%`,
      });

    if (bookId) {
      queryBuilder.andWhere('entry.bookId = :bookId', { bookId });
    }

    return await queryBuilder
      .orderBy('entry.entryDate', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Find entries by tags
   */
  async findByTags(tags: string[], bookId?: string): Promise<BookEntry[]> {
    const queryBuilder = this.bookEntryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.book', 'book');

    const tagConditions = tags.map((tag, index) => {
      queryBuilder.setParameter(`tag${index}`, `%${tag}%`);
      return `entry.tags LIKE :tag${index}`;
    });

    queryBuilder.where(`(${tagConditions.join(' OR ')})`);

    if (bookId) {
      queryBuilder.andWhere('entry.bookId = :bookId', { bookId });
    }

    return await queryBuilder
      .orderBy('entry.entryDate', 'DESC')
      .getMany();
  }

  /**
   * Get timeline entries for a date range
   */
  async getTimeline(
    bookId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BookEntry[]> {
    return await this.bookEntryRepository.find({
      where: {
        bookId,
        entryDate: Between(startDate, endDate),
      },
      order: { entryDate: 'DESC' },
      relations: ['book'],
    });
  }

  /**
   * Get recent entries
   */
  async getRecentEntries(bookId?: string, days = 30, limit = 50): Promise<BookEntry[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const where: FindOptionsWhere<BookEntry> = {
      entryDate: Between(cutoffDate, new Date()),
    };

    if (bookId) {
      where.bookId = bookId;
    }

    return await this.bookEntryRepository.find({
      where,
      order: { entryDate: 'DESC' },
      take: limit,
      relations: ['book'],
    });
  }

  /**
   * Update a book entry
   */
  async update(id: string, updateBookEntryDto: UpdateBookEntryDto): Promise<BookEntry> {
    const bookEntry = await this.findOne(id);

    // Handle date string conversion if provided
    if (updateBookEntryDto.entryDate) {
      bookEntry.entryDate = new Date(updateBookEntryDto.entryDate);
    }

    // Update other properties directly
    if (updateBookEntryDto.bookId !== undefined) {
      bookEntry.bookId = updateBookEntryDto.bookId;
    }

    if (updateBookEntryDto.type !== undefined) {
      bookEntry.type = updateBookEntryDto.type;
    }

    if (updateBookEntryDto.summary !== undefined) {
      bookEntry.summary = updateBookEntryDto.summary;
    }

    if (updateBookEntryDto.details !== undefined) {
      bookEntry.details = updateBookEntryDto.details;
    }

    if (updateBookEntryDto.attachedFileUrl !== undefined) {
      bookEntry.attachedFileUrl = updateBookEntryDto.attachedFileUrl;
    }

    if (updateBookEntryDto.tags !== undefined) {
      bookEntry.tags = updateBookEntryDto.tags;
    }

    if (updateBookEntryDto.appointmentId !== undefined) {
      bookEntry.appointmentId = updateBookEntryDto.appointmentId;
    }

    if (updateBookEntryDto.prescriptionId !== undefined) {
      bookEntry.prescriptionId = updateBookEntryDto.prescriptionId;
    }

    if (updateBookEntryDto.uploadedBy !== undefined) {
      bookEntry.uploadedBy = updateBookEntryDto.uploadedBy;
    }

    try {
      return await this.bookEntryRepository.save(bookEntry);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to update book entry: ' + message);
    }
  }

  /**
   * Remove/delete a book entry
   */
  async remove(id: string): Promise<void> {
    const bookEntry = await this.findOne(id);

    try {
      await this.bookEntryRepository.remove(bookEntry);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to delete book entry: ' + message);
    }
  }

  /**
   * Get entry statistics for a book
   */
  async getStatistics(bookId?: string): Promise<{
    total: number;
    byType: Record<EntryType, number>;
    byUploadedBy: Record<string, number>;
    recentCount: number; // last 7 days
  }> {
    const where: FindOptionsWhere<BookEntry> = bookId ? { bookId } : {};

    const [total, entries] = await Promise.all([
      this.bookEntryRepository.count({ where }),
      this.bookEntryRepository.find({ where, select: ['type', 'uploadedBy', 'entryDate'] }),
    ]);

    // Count by type
    const byType: Record<EntryType, number> = {
      visit: 0,
      note: 0,
      lab: 0,
      vitals: 0,
      med_change: 0,
      imaging: 0,
      attachment: 0,
    };

    // Count by uploader
    const byUploadedBy: Record<string, number> = {};

    // Count recent entries (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    let recentCount = 0;

    entries.forEach((entry) => {
      // Count by type
      byType[entry.type]++;

      // Count by uploader
      byUploadedBy[entry.uploadedBy] = (byUploadedBy[entry.uploadedBy] || 0) + 1;

      // Count recent entries
      if (entry.entryDate >= weekAgo) {
        recentCount++;
      }
    });

    return {
      total,
      byType,
      byUploadedBy,
      recentCount,
    };
  }

  /**
   * Bulk create entries
   */
  async bulkCreate(createBookEntryDtos: CreateBookEntryDto[]): Promise<BookEntry[]> {
    try {
      const bookEntries = createBookEntryDtos.map((dto) =>
        this.bookEntryRepository.create({
          ...dto,
          entryDate: new Date(dto.entryDate),
          uploadedBy: dto.uploadedBy || 'doctor',
        })
      );

      return await this.bookEntryRepository.save(bookEntries);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to bulk create book entries: ' + message);
    }
  }

  /**
   * Get entry count for a book
   */
  async getEntryCount(bookId: string): Promise<number> {
    return await this.bookEntryRepository.count({ where: { bookId } });
  }

  /**
   * Get entries with attachments
   */
  async getEntriesWithAttachments(bookId?: string): Promise<BookEntry[]> {
    const where: FindOptionsWhere<BookEntry> = {
      attachedFileUrl: Like('%'),
    };

    if (bookId) {
      where.bookId = bookId;
    }

    return await this.bookEntryRepository.find({
      where,
      order: { entryDate: 'DESC' },
      relations: ['book'],
    });
  }
}
