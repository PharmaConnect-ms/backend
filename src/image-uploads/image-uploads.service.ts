import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ImageUploadUrl , getImageUrl } from '@/common/const';
import { ImageUploadResponseDto } from './dto/image-upload-response.dto';

@Injectable()
export class ImageUploadsService {

  async imageUpload(file: Express.Multer.File): Promise<ImageUploadResponseDto> {
    const formData = new FormData();
    const fileName = `${Date.now()}-${file.originalname}`;
    formData.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), fileName);

    const res = await axios.post(ImageUploadUrl, formData, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return res.data as ImageUploadResponseDto;
  }


   getImageUrl(filename: string): Promise<string> {
    const url = getImageUrl(filename);
    return Promise.resolve(url);
  }
}
