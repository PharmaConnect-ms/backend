import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FollowUpService } from './follow-up.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { UpdateFollowUpDto } from './dto/update-follow-up.dto';
import { QueryFollowUpDto } from './dto/query-follow-up.dto';
import { FollowUpResponseDto, FollowUpStatisticsDto } from './dto/follow-up-response.dto';
import { RescheduleFollowUpDto } from './dto/status-change.dto';

@ApiTags('follow-up')
@Controller('follow-up')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new follow-up' })
  @ApiResponse({ status: 201, description: 'Follow-up created successfully', type: FollowUpResponseDto })
  create(@Body() createFollowUpDto: CreateFollowUpDto) {
    return this.followUpService.create(createFollowUpDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all follow-ups with optional filtering' })
  @ApiResponse({ status: 200, description: 'List of follow-ups', type: [FollowUpResponseDto] })
  findAll(@Query() queryDto: QueryFollowUpDto) {
    const options = {
      bookId: queryDto.bookId,
      status: queryDto.status,
      kind: queryDto.kind,
      dueAfter: queryDto.dueAfter ? new Date(queryDto.dueAfter) : undefined,
      dueBefore: queryDto.dueBefore ? new Date(queryDto.dueBefore) : undefined,
      limit: queryDto.limit,
      offset: queryDto.offset,
    };
    return this.followUpService.findAll(options);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get follow-up statistics' })
  @ApiResponse({ status: 200, description: 'Follow-up statistics', type: FollowUpStatisticsDto })
  getStatistics(@Query('bookId') bookId?: string) {
    return this.followUpService.getStatistics(bookId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming follow-ups' })
  @ApiResponse({ status: 200, description: 'List of upcoming follow-ups', type: [FollowUpResponseDto] })
  findUpcoming(@Query('limit') limit?: number) {
    return this.followUpService.findUpcoming(limit);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue follow-ups' })
  @ApiResponse({ status: 200, description: 'List of overdue follow-ups', type: [FollowUpResponseDto] })
  findOverdue() {
    return this.followUpService.findOverdue();
  }

  @Get('due-for-reminders')
  @ApiOperation({ summary: 'Get follow-ups due for reminders' })
  @ApiResponse({ status: 200, description: 'List of follow-ups due for reminders', type: [FollowUpResponseDto] })
  findDueForReminders() {
    return this.followUpService.findDueForReminders();
  }

  @Get('due-in-days/:days')
  @ApiOperation({ summary: 'Get follow-ups due in next N days' })
  @ApiParam({ name: 'days', type: 'number', description: 'Number of days' })
  @ApiResponse({ status: 200, description: 'List of follow-ups due in specified days', type: [FollowUpResponseDto] })
  findDueInDays(@Param('days') days: string, @Query('bookId') bookId?: string) {
    return this.followUpService.findDueInDays(parseInt(days, 10), bookId);
  }

  @Get('book/:bookId')
  @ApiOperation({ summary: 'Get follow-ups by book ID' })
  @ApiParam({ name: 'bookId', type: 'string', description: 'Book ID' })
  @ApiResponse({ status: 200, description: 'List of follow-ups for the book', type: [FollowUpResponseDto] })
  findByBookId(@Param('bookId') bookId: string) {
    return this.followUpService.findByBookId(bookId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a follow-up by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Follow-up UUID' })
  @ApiResponse({ status: 200, description: 'Follow-up details', type: FollowUpResponseDto })
  @ApiResponse({ status: 404, description: 'Follow-up not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.followUpService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a follow-up' })
  @ApiParam({ name: 'id', type: 'string', description: 'Follow-up UUID' })
  @ApiResponse({ status: 200, description: 'Follow-up updated successfully', type: FollowUpResponseDto })
  @ApiResponse({ status: 404, description: 'Follow-up not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateFollowUpDto: UpdateFollowUpDto) {
    return this.followUpService.update(id, updateFollowUpDto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark follow-up as completed' })
  @ApiParam({ name: 'id', type: 'string', description: 'Follow-up UUID' })
  @ApiResponse({ status: 200, description: 'Follow-up marked as completed', type: FollowUpResponseDto })
  markAsCompleted(@Param('id', ParseUUIDPipe) id: string) {
    return this.followUpService.markAsCompleted(id);
  }

  @Patch(':id/miss')
  @ApiOperation({ summary: 'Mark follow-up as missed' })
  @ApiParam({ name: 'id', type: 'string', description: 'Follow-up UUID' })
  @ApiResponse({ status: 200, description: 'Follow-up marked as missed', type: FollowUpResponseDto })
  markAsMissed(@Param('id', ParseUUIDPipe) id: string) {
    return this.followUpService.markAsMissed(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Mark follow-up as cancelled' })
  @ApiParam({ name: 'id', type: 'string', description: 'Follow-up UUID' })
  @ApiResponse({ status: 200, description: 'Follow-up marked as cancelled', type: FollowUpResponseDto })
  markAsCancelled(@Param('id', ParseUUIDPipe) id: string) {
    return this.followUpService.markAsCancelled(id);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a follow-up' })
  @ApiParam({ name: 'id', type: 'string', description: 'Follow-up UUID' })
  @ApiResponse({ status: 200, description: 'Follow-up rescheduled successfully', type: FollowUpResponseDto })
  reschedule(@Param('id', ParseUUIDPipe) id: string, @Body() rescheduleDto: RescheduleFollowUpDto) {
    return this.followUpService.reschedule(id, new Date(rescheduleDto.newDueAt), rescheduleDto.notes);
  }

  @Patch('mark-overdue-as-missed')
  @ApiOperation({ summary: 'Mark all overdue follow-ups as missed' })
  @ApiResponse({ status: 200, description: 'Number of follow-ups marked as missed' })
  markOverdueAsMissed() {
    return this.followUpService.markOverdueAsMissed();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a follow-up' })
  @ApiParam({ name: 'id', type: 'string', description: 'Follow-up UUID' })
  @ApiResponse({ status: 200, description: 'Follow-up deleted successfully' })
  @ApiResponse({ status: 404, description: 'Follow-up not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.followUpService.remove(id);
  }
}
