import { Test, TestingModule } from '@nestjs/testing';
import { ConditionBookService } from './condition-book.service';

describe('ConditionBookService', () => {
  let service: ConditionBookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConditionBookService],
    }).compile();

    service = module.get<ConditionBookService>(ConditionBookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
