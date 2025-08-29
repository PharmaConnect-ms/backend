import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BookEntryService } from './book-entry.service';
import { CreateBookEntryDto } from './dto/create-book-entry.dto';
import { UpdateBookEntryDto } from './dto/update-book-entry.dto';

@Controller('book-entry')
export class BookEntryController {
  constructor(private readonly bookEntryService: BookEntryService) {}

  @Post()
  create(@Body() createBookEntryDto: CreateBookEntryDto) {
    return this.bookEntryService.create(createBookEntryDto);
  }

  @Get()
  findAll() {
    return this.bookEntryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookEntryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookEntryDto: UpdateBookEntryDto) {
    return this.bookEntryService.update(+id, updateBookEntryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookEntryService.remove(+id);
  }
}
