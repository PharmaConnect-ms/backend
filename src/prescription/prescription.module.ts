import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from './entities/prescription.entity';
import { PrescriptionService } from './prescription.service';
import { PrescriptionController } from './prescription.controller';
import { User } from '@/users/user.entity'; 
import { ImageUploadsService } from '@/image-uploads/image-uploads.service';
import { OpenAIService } from '@/openai/openai.service';
import { UsersService } from '@/users/users.service';
import { NotificationModule } from '@/notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([Prescription, User]), NotificationModule], 
  controllers: [PrescriptionController],
  providers: [PrescriptionService, ImageUploadsService, OpenAIService, UsersService],
})
export class PrescriptionModule {}
