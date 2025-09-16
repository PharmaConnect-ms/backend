import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowUpService } from './follow-up.service';
import { FollowUpController } from './follow-up.controller';
import { FollowUp } from './entities/follow-up.entity';
import { ConditionBook } from '@/condition-book/entities/condition-book.entity';
import { OpenAIModule } from '@/openai/openai.module';
import { NotificationModule } from '@/notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([FollowUp, ConditionBook]), OpenAIModule, NotificationModule],
  controllers: [FollowUpController],
  providers: [FollowUpService],
  exports: [FollowUpService],
})
export class FollowUpModule {}
