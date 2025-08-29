import { Test, TestingModule } from '@nestjs/testing';
import { BookEntryController } from './book-entry.controller';
import { BookEntryService } from './book-entry.service';

describe('BookEntryController', () => {
  let controller: BookEntryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookEntryController],
      providers: [BookEntryService],
    }).compile();

    controller = module.get<BookEntryController>(BookEntryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
