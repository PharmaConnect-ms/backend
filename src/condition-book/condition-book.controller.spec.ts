import { Test, TestingModule } from '@nestjs/testing';
import { ConditionBookController } from './condition-book.controller';
import { ConditionBookService } from './condition-book.service';

describe('ConditionBookController', () => {
  let controller: ConditionBookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConditionBookController],
      providers: [ConditionBookService],
    }).compile();

    controller = module.get<ConditionBookController>(ConditionBookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
