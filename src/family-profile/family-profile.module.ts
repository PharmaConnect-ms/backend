import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyProfileController } from './family-profile.controller';
import { FamilyProfileService } from './family-profile.service';
import { FamilyMember } from './entities/family-member.entity';
import { CareProfile } from './entities/care-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FamilyMember, CareProfile])],
  controllers: [FamilyProfileController],
  providers: [FamilyProfileService],
  exports: [FamilyProfileService],
})
export class FamilyProfileModule {}
