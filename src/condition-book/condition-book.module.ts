import { Module } from '@nestjs/common';
import { ConditionBookService } from './condition-book.service';
import { ConditionBookController } from './condition-book.controller';
import { BookEntry } from '@/book-entry/entities/book-entry.entity';
import { FollowUp } from '@/follow-up/entities/follow-up.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionBook } from './entities/condition-book.entity';

@Module({
  controllers: [ConditionBookController],
  providers: [ConditionBookService],
  imports: [TypeOrmModule.forFeature([ConditionBook, BookEntry, FollowUp])],
  exports: [ConditionBookService],
})
export class ConditionBookModule {}
