import { Test, TestingModule } from '@nestjs/testing';
import { ImageUploadsService } from './image-uploads.service';

describe('ImageUploadsService', () => {
  let service: ImageUploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageUploadsService],
    }).compile();

    service = module.get<ImageUploadsService>(ImageUploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
