import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BookEntryService } from './book-entry.service';
import { CreateBookEntryDto } from './dto/create-book-entry.dto';
import { UpdateBookEntryDto } from './dto/update-book-entry.dto';
import { QueryBookEntryDto } from './dto/query-book-entry.dto';
import { BookEntryResponseDto, BookEntryStatisticsDto } from './dto/book-entry-response.dto';
import { TimelineQueryDto } from './dto/timeline.dto';
import { EntryType } from './entities/book-entry.entity';

@ApiTags('book-entry')
@Controller('book-entry')
export class BookEntryController {
  constructor(private readonly bookEntryService: BookEntryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new book entry' })
  @ApiResponse({ status: 201, description: 'Book entry created successfully', type: BookEntryResponseDto })
  create(@Body() createBookEntryDto: CreateBookEntryDto) {
    return this.bookEntryService.create(createBookEntryDto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create book entries' })
  @ApiResponse({ status: 201, description: 'Book entries created successfully', type: [BookEntryResponseDto] })
  bulkCreate(@Body('entries') entries: CreateBookEntryDto[]) {
    return this.bookEntryService.bulkCreate(entries);
  }

  @Get()
  @ApiOperation({ summary: 'Get all book entries with optional filtering' })
  @ApiResponse({ status: 200, description: 'List of book entries', type: [BookEntryResponseDto] })
  findAll(@Query() queryDto: QueryBookEntryDto) {
    const options = {
      bookId: queryDto.bookId,
      type: queryDto.type,
      uploadedBy: queryDto.uploadedBy,
      entryAfter: queryDto.entryAfter ? new Date(queryDto.entryAfter) : undefined,
      entryBefore: queryDto.entryBefore ? new Date(queryDto.entryBefore) : undefined,
      appointmentId: queryDto.appointmentId,
      prescriptionId: queryDto.prescriptionId,
      searchTerm: queryDto.searchTerm,
      tags: queryDto.tags,
      limit: queryDto.limit,
      offset: queryDto.offset,
    };
    return this.bookEntryService.findAll(options);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get book entry statistics' })
  @ApiResponse({ status: 200, description: 'Book entry statistics', type: BookEntryStatisticsDto })
  @ApiQuery({ name: 'bookId', required: false, type: String })
  getStatistics(@Query('bookId') bookId?: string) {
    return this.bookEntryService.getStatistics(bookId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search book entries' })
  @ApiResponse({ status: 200, description: 'Search results', type: [BookEntryResponseDto] })
  @ApiQuery({ name: 'term', required: true, type: String })
  @ApiQuery({ name: 'bookId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  searchEntries(
    @Query('term') searchTerm: string,
    @Query('bookId') bookId?: string,
    @Query('limit') limit?: number
  ) {
    return this.bookEntryService.searchEntries(searchTerm, bookId, limit);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent book entries' })
  @ApiResponse({ status: 200, description: 'Recent book entries', type: [BookEntryResponseDto] })
  @ApiQuery({ name: 'bookId', required: false, type: String })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRecentEntries(
    @Query('bookId') bookId?: string,
    @Query('days') days?: number,
    @Query('limit') limit?: number
  ) {
    return this.bookEntryService.getRecentEntries(bookId, days, limit);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Get timeline entries for a date range' })
  @ApiResponse({ status: 200, description: 'Timeline entries', type: [BookEntryResponseDto] })
  getTimeline(@Query() timelineQuery: TimelineQueryDto) {
    return this.bookEntryService.getTimeline(
      timelineQuery.bookId,
      new Date(timelineQuery.startDate),
      new Date(timelineQuery.endDate)
    );
  }

  @Get('with-attachments')
  @ApiOperation({ summary: 'Get entries with attachments' })
  @ApiResponse({ status: 200, description: 'Entries with attachments', type: [BookEntryResponseDto] })
  @ApiQuery({ name: 'bookId', required: false, type: String })
  getEntriesWithAttachments(@Query('bookId') bookId?: string) {
    return this.bookEntryService.getEntriesWithAttachments(bookId);
  }

  @Get('by-type/:type')
  @ApiOperation({ summary: 'Get entries by type' })
  @ApiParam({ name: 'type', enum: ['visit', 'note', 'lab', 'vitals', 'med_change', 'imaging', 'attachment'] })
  @ApiResponse({ status: 200, description: 'Entries by type', type: [BookEntryResponseDto] })
  @ApiQuery({ name: 'bookId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByType(
    @Param('type') type: EntryType,
    @Query('bookId') bookId?: string,
    @Query('limit') limit?: number
  ) {
    return this.bookEntryService.findByType(type, bookId, limit);
  }

  @Get('by-tags')
  @ApiOperation({ summary: 'Get entries by tags' })
  @ApiResponse({ status: 200, description: 'Entries by tags', type: [BookEntryResponseDto] })
  @ApiQuery({ name: 'tags', required: true, type: [String] })
  @ApiQuery({ name: 'bookId', required: false, type: String })
  findByTags(
    @Query('tags') tags: string[],
    @Query('bookId') bookId?: string
  ) {
    // Ensure tags is an array
    const tagArray = Array.isArray(tags) ? tags : [tags];
    return this.bookEntryService.findByTags(tagArray, bookId);
  }

  @Get('book/:bookId')
  @ApiOperation({ summary: 'Get entries by book ID' })
  @ApiParam({ name: 'bookId', type: 'string', description: 'Book ID' })
  @ApiResponse({ status: 200, description: 'Entries for the book', type: [BookEntryResponseDto] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  findByBookId(
    @Param('bookId') bookId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.bookEntryService.findByBookId(bookId, limit, offset);
  }

  @Get('book/:bookId/count')
  @ApiOperation({ summary: 'Get entry count for a book' })
  @ApiParam({ name: 'bookId', type: 'string', description: 'Book ID' })
  @ApiResponse({ status: 200, description: 'Entry count' })
  getEntryCount(@Param('bookId') bookId: string) {
    return this.bookEntryService.getEntryCount(bookId);
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get entries by appointment ID' })
  @ApiParam({ name: 'appointmentId', type: 'string', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Entries for the appointment', type: [BookEntryResponseDto] })
  findByAppointmentId(@Param('appointmentId') appointmentId: string) {
    return this.bookEntryService.findByAppointmentId(appointmentId);
  }

  @Get('prescription/:prescriptionId')
  @ApiOperation({ summary: 'Get entries by prescription ID' })
  @ApiParam({ name: 'prescriptionId', type: 'string', description: 'Prescription ID' })
  @ApiResponse({ status: 200, description: 'Entries for the prescription', type: [BookEntryResponseDto] })
  findByPrescriptionId(@Param('prescriptionId') prescriptionId: string) {
    return this.bookEntryService.findByPrescriptionId(prescriptionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book entry by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Book entry UUID' })
  @ApiResponse({ status: 200, description: 'Book entry details', type: BookEntryResponseDto })
  @ApiResponse({ status: 404, description: 'Book entry not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookEntryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a book entry' })
  @ApiParam({ name: 'id', type: 'string', description: 'Book entry UUID' })
  @ApiResponse({ status: 200, description: 'Book entry updated successfully', type: BookEntryResponseDto })
  @ApiResponse({ status: 404, description: 'Book entry not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateBookEntryDto: UpdateBookEntryDto) {
    return this.bookEntryService.update(id, updateBookEntryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book entry' })
  @ApiParam({ name: 'id', type: 'string', description: 'Book entry UUID' })
  @ApiResponse({ status: 200, description: 'Book entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Book entry not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookEntryService.remove(id);
  }
}
