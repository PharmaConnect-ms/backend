import { Injectable } from '@nestjs/common';
import { CreateBookEntryDto } from './dto/create-book-entry.dto';
import { UpdateBookEntryDto } from './dto/update-book-entry.dto';

@Injectable()
export class BookEntryService {
  create(createBookEntryDto: CreateBookEntryDto) {
    return 'This action adds a new bookEntry';
  }

  findAll() {
    return `This action returns all bookEntry`;
  }

  findOne(id: number) {
    return `This action returns a #${id} bookEntry`;
  }

  update(id: number, updateBookEntryDto: UpdateBookEntryDto) {
    return `This action updates a #${id} bookEntry`;
  }

  remove(id: number) {
    return `This action removes a #${id} bookEntry`;
  }
}
