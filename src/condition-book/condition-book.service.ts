/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/condition-book/condition-book.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, Between, FindOptionsWhere, MoreThan, Repository } from 'typeorm';
import { ConditionBook } from './entities/condition-book.entity';
import { BookEntry } from '@/book-entry/entities/book-entry.entity';
import { FollowUp } from '@/follow-up/entities/follow-up.entity';
import { CreateConditionBookDto } from './dto/create-condition-book.dto';
import { UpdateConditionBookDto } from './dto/update-condition-book.dto';
import { CreateBookEntryDto } from '@/book-entry/dto/create-book-entry.dto';
import { CreateFollowUpDto } from '@/follow-up/dto/create-follow-up.dto';
import { QueryEntriesDto } from './dto/query-entries.dto';
import { FollowUpStatus } from '@/follow-up/entities/follow-up.entity';

@Injectable()
export class ConditionBookService {
  constructor(
    @InjectRepository(ConditionBook) private readonly bookRepo: Repository<ConditionBook>,
    @InjectRepository(BookEntry) private readonly entryRepo: Repository<BookEntry>,
    @InjectRepository(FollowUp) private readonly folRepo: Repository<FollowUp>,
  ) {}

  // BOOKS
  async createBook(dto: CreateConditionBookDto) {
    const book = this.bookRepo.create({
      ...dto,
      onsetDate: dto.onsetDate ? new Date(dto.onsetDate).toISOString().split('T')[0] : undefined,
    });
    return this.bookRepo.save(book);
  }

  async getBook(bookId: string) {
    const book = await this.bookRepo.findOne({ where: { id: bookId } });
    if (!book) throw new NotFoundException('Book not found');
    // You can aggregate a summary here (active follow-up, last entry, etc.)
    return book;
  }

  async listBooksByPatient(patientId: string) {
    console.log('Listing books for patient:', patientId);   
    return this.bookRepo.find({ where: { patientId }, order: { updatedAt: 'DESC' } });
  }

  async updateBook(bookId: string, dto: UpdateConditionBookDto) {
    const updateData = {
      ...dto,
      onsetDate: dto.onsetDate ? new Date(dto.onsetDate).toISOString().split('T')[0] : dto.onsetDate,
    };
    await this.bookRepo.update(bookId, updateData);
    return this.getBook(bookId);
  }

  // ENTRIES
  async addEntry(dto: CreateBookEntryDto) {
    const exists = await this.bookRepo.exist({ where: { id: dto.bookId } });
    if (!exists) throw new NotFoundException('Book not found');
    const entry = this.entryRepo.create({
      ...dto,
      entryDate: new Date(dto.entryDate),
    });
    const saved = await this.entryRepo.save(entry);
    // bump book updated time
    await this.bookRepo.update(dto.bookId, { updatedAt: new Date() });
    return saved;
  }

  async listEntries(bookId: string, q: QueryEntriesDto) {
    const where: FindOptionsWhere<BookEntry> = { bookId };
    if (q.type) (where as any).type = q.type;

    if (q.from && q.to) {
      (where as any).entryDate = Between(new Date(q.from), new Date(q.to));
    } else if (q.from) {
      (where as any).entryDate = MoreThan(new Date(q.from));
    }

    if (q.tags) {
      // simple LIKE filter for CSV tags
      (where as any).tags = And();
      // Use QueryBuilder if you want more robust tag matching
    }

    return this.entryRepo.find({
      where,
      order: { entryDate: 'DESC', createdAt: 'DESC' },
      take: 50,
    });
  }

  // FOLLOW-UPS
  async scheduleFollowUp(dto: CreateFollowUpDto) {
    const exists = await this.bookRepo.exist({ where: { id: dto.bookId } });
    if (!exists) throw new NotFoundException('Book not found');

    const follow = this.folRepo.create({
      ...dto,
      dueAt: new Date(dto.dueAt),
      remindAt1: dto.remindAt1 ? new Date(dto.remindAt1) : undefined,
      remindAt2: dto.remindAt2 ? new Date(dto.remindAt2) : undefined,
    });
    const saved = await this.folRepo.save(follow);

    // 🔔 Emit to your notification pipeline (pseudo)
    // this.notifications.queueFollowUp(saved);

    return saved;
  }

  async listFollowUps(bookId: string, status?: FollowUpStatus) {
    return this.folRepo.find({
      where: { bookId, ...(status ? { status } : {}) },
      order: { dueAt: 'ASC' },
      take: 100,
    });
  }

  async updateFollowUpStatus(id: string, status: FollowUpStatus) {
    await this.folRepo.update(id, { status });
    return this.folRepo.findOne({ where: { id } });
  }
}
