import { Test, TestingModule } from '@nestjs/testing';
import { BookEntryService } from './book-entry.service';

describe('BookEntryService', () => {
  let service: BookEntryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookEntryService],
    }).compile();

    service = module.get<BookEntryService>(BookEntryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
