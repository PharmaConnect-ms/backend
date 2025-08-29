import { Test, TestingModule } from '@nestjs/testing';
import { ImageUploadsController } from './image-uploads.controller';
import { ImageUploadsService } from './image-uploads.service';

describe('ImageUploadsController', () => {
  let controller: ImageUploadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageUploadsController],
      providers: [ImageUploadsService],
    }).compile();

    controller = module.get<ImageUploadsController>(ImageUploadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
