import { PartialType } from '@nestjs/swagger';
import { CreateBookEntryDto } from './create-book-entry.dto';

export class UpdateBookEntryDto extends PartialType(CreateBookEntryDto) {}
