import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookEntryService } from './book-entry.service';
import { BookEntryController } from './book-entry.controller';
import { BookEntry } from './entities/book-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BookEntry])],
  controllers: [BookEntryController],
  providers: [BookEntryService],
  exports: [BookEntryService],
})
export class BookEntryModule {}
