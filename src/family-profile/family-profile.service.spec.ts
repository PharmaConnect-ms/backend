import { Test, TestingModule } from '@nestjs/testing';
import { FamilyProfileService } from './family-profile.service';

describe('FamilyProfileService', () => {
  let service: FamilyProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FamilyProfileService],
    }).compile();

    service = module.get<FamilyProfileService>(FamilyProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
