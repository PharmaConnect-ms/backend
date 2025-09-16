import { Test, TestingModule } from '@nestjs/testing';
import { FamilyProfileController } from './family-profile.controller';
import { FamilyProfileService } from './family-profile.service';

describe('FamilyProfileController', () => {
  let controller: FamilyProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FamilyProfileController],
      providers: [FamilyProfileService],
    }).compile();

    controller = module.get<FamilyProfileController>(FamilyProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
