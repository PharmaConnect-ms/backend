import { Module } from '@nestjs/common';
import { ImageUploadsService } from './image-uploads.service';
import { ImageUploadsController } from './image-uploads.controller';

@Module({
  controllers: [ImageUploadsController],
  providers: [ImageUploadsService],
})
export class ImageUploadsModule {}
