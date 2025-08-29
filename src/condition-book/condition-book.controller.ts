// src/condition-book/condition-book.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConditionBookService } from './condition-book.service';
import { CreateConditionBookDto } from './dto/create-condition-book.dto';
import { UpdateConditionBookDto } from './dto/update-condition-book.dto';
import { CreateBookEntryDto } from '@/book-entry/dto/create-book-entry.dto';
import { CreateFollowUpDto } from '@/follow-up/dto/create-follow-up.dto';
import { QueryEntriesDto } from './dto/query-entries.dto';
import { FollowUpStatus } from '@/follow-up/entities/follow-up.entity';

@ApiTags('Condition Books')
@Controller('condition-books')
export class ConditionBookController {
  constructor(private readonly svc: ConditionBookService) {}

  // BOOKS
  @Post()
  @ApiOperation({ summary: 'Create a condition book' })
  createBook(@Body() dto: CreateConditionBookDto) { return this.svc.createBook(dto); }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'List books for a patient' })
  listBooks(@Param('patientId') patientId: string) { return this.svc.listBooksByPatient(patientId); }

  @Get(':bookId')
  @ApiOperation({ summary: 'Get a book summary' })
  getBook(@Param('bookId') bookId: string) { return this.svc.getBook(bookId); }

  @Patch(':bookId')
  @ApiOperation({ summary: 'Update book metadata' })
  updateBook(@Param('bookId') bookId: string, @Body() dto: UpdateConditionBookDto) { return this.svc.updateBook(bookId, dto); }

  // ENTRIES
  @Post(':bookId/entries')
  @ApiOperation({ summary: 'Add a timeline entry' })
  addEntry(@Param('bookId') bookId: string, @Body() dto: CreateBookEntryDto) {
    return this.svc.addEntry({ ...dto, bookId });
  }

  @Get(':bookId/entries')
  @ApiOperation({ summary: 'List timeline entries' })
  listEntries(@Param('bookId') bookId: string, @Query() q: QueryEntriesDto) {
    return this.svc.listEntries(bookId, q);
  }

  // FOLLOW-UPS
  @Post(':bookId/follow-ups')
  @ApiOperation({ summary: 'Schedule a follow-up' })
  addFollowUp(@Param('bookId') bookId: string, @Body() dto: CreateFollowUpDto) {
    return this.svc.scheduleFollowUp({ ...dto, bookId });
  }

  @Get(':bookId/follow-ups')
  @ApiOperation({ summary: 'List follow-ups' })
  listFollowUps(@Param('bookId') bookId: string, @Query('status') status?: FollowUpStatus) {
    return this.svc.listFollowUps(bookId, status);
  }

  @Patch('follow-ups/:id/status')
  @ApiOperation({ summary: 'Update follow-up status' })
  updateFollowUpStatus(@Param('id') id: string, @Body('status') status: FollowUpStatus) {
    return this.svc.updateFollowUpStatus(id, status);
  }
}
