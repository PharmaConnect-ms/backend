import { Module } from '@nestjs/common';
import { BookEntryService } from './book-entry.service';
import { BookEntryController } from './book-entry.controller';

@Module({
  controllers: [BookEntryController],
  providers: [BookEntryService],
})
export class BookEntryModule {}
