import { Controller, Post, UseInterceptors, BadRequestException, UploadedFile, Get, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ImageUploadsService } from './image-uploads.service';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { ImageUploadResponseDto } from './dto/image-upload-response.dto';

@Controller('image-uploads')
export class ImageUploadsController {
  constructor(private readonly imageUploadsService: ImageUploadsService) {}

   @Post('upload-image')
   @ApiOperation({ summary: 'Upload an image for processing' })
   @ApiConsumes('multipart/form-data')
   @UseInterceptors(
     FileInterceptor('file', {
       limits: { fileSize: 10 * 1024 * 1024 },
       fileFilter: (_req, file, cb) => {
         const ok = /image\/(png|jpeg|jpg|webp|heic|heif|gif|bmp|tiff)/i.test(
           file.mimetype,
         );
         cb(ok ? null : new BadRequestException('Unsupported image type'), ok);
       },
     }),
   )
   @ApiBody({
     schema: {
       type: 'object',
       required: ['file'],
       properties: {
         file: { type: 'string', format: 'binary' },
       },
     },
   })
   @ApiResponse({
     status: 200,
     description: 'Successful image upload',
     schema: { example: { answer: { message: '...', file: { name: '...', url: '...' } } } },
   })
   async askImage(
     @UploadedFile() file: Express.Multer.File,
   ) {
     if (!file) throw new BadRequestException('Image file is required');
     const answer: ImageUploadResponseDto = await this.imageUploadsService.imageUpload(file);
     return { answer };
   }

   @Get('image-Url')
   async getImageUrl(@Query('filename') filename: string) {
     if (!filename) throw new BadRequestException('Filename is required');
     const url = await this.imageUploadsService.getImageUrl(filename);
     return { url };
   }

}
