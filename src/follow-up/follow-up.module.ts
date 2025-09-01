import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowUpService } from './follow-up.service';
import { FollowUpController } from './follow-up.controller';
import { FollowUp } from './entities/follow-up.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FollowUp])],
  controllers: [FollowUpController],
  providers: [FollowUpService],
  exports: [FollowUpService],
})
export class FollowUpModule {}
