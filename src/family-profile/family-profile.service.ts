import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyMember } from './entities/family-member.entity';
import { CareProfile } from './entities/care-profile.entity';
import {
  CreateFamilyMemberDto,
  UpdateFamilyMemberDto,
  CreateCareProfileDto,
} from './dto';

@Injectable()
export class FamilyProfileService {
  constructor(
    @InjectRepository(FamilyMember)
    private familyMemberRepository: Repository<FamilyMember>,
    @InjectRepository(CareProfile)
    private careProfileRepository: Repository<CareProfile>,
  ) {}

  async createFamilyMember(
    createFamilyMemberDto: CreateFamilyMemberDto,
    caregiverId: string,
  ): Promise<FamilyMember> {
    const familyMemberData = {
      ...createFamilyMemberDto,
      caregiverId,
      dateOfBirth: createFamilyMemberDto.dateOfBirth
        ? new Date(createFamilyMemberDto.dateOfBirth)
        : undefined,
    };

    const familyMember = this.familyMemberRepository.create(familyMemberData);
    return await this.familyMemberRepository.save(familyMember);
  }

  async getFamilyMembers(caregiverId: string): Promise<FamilyMember[]> {
    return await this.familyMemberRepository.find({
      where: { caregiverId, isActive: true },
      relations: ['careProfiles'],
      order: { createdAt: 'DESC' },
    });
  }

  async getFamilyMemberById(
    id: string,
    caregiverId: string,
  ): Promise<FamilyMember> {
    const familyMember = await this.familyMemberRepository.findOne({
      where: { id, caregiverId },
      relations: ['careProfiles', 'appointments'],
    });

    if (!familyMember) {
      throw new NotFoundException('Family member not found');
    }

    return familyMember;
  }

  async getFamilyMemberByIdSimple(id: string): Promise<FamilyMember> {
    const familyMember = await this.familyMemberRepository.findOne({
      where: { id },
      relations: ['careProfiles', 'appointments'],
    });

    if (!familyMember) {
      throw new NotFoundException('Family member not found');
    }

    return familyMember;
  }

  async updateFamilyMember(
    id: string,
    updateFamilyMemberDto: UpdateFamilyMemberDto,
    caregiverId: string,
  ): Promise<FamilyMember> {
    const familyMember = await this.getFamilyMemberById(id, caregiverId);

    Object.assign(familyMember, {
      ...updateFamilyMemberDto,
      dateOfBirth: updateFamilyMemberDto.dateOfBirth
        ? new Date(updateFamilyMemberDto.dateOfBirth)
        : familyMember.dateOfBirth,
    });

    return await this.familyMemberRepository.save(familyMember);
  }

  async updateFamilyMemberSimple(
    id: string,
    updateFamilyMemberDto: UpdateFamilyMemberDto,
  ): Promise<FamilyMember> {
    const familyMember = await this.getFamilyMemberByIdSimple(id);

    Object.assign(familyMember, {
      ...updateFamilyMemberDto,
      dateOfBirth: updateFamilyMemberDto.dateOfBirth
        ? new Date(updateFamilyMemberDto.dateOfBirth)
        : familyMember.dateOfBirth,
    });

    return await this.familyMemberRepository.save(familyMember);
  }

  async deleteFamilyMember(id: string, caregiverId: string): Promise<void> {
    const familyMember = await this.getFamilyMemberById(id, caregiverId);
    familyMember.isActive = false;
    await this.familyMemberRepository.save(familyMember);
  }

  async deleteFamilyMemberSimple(id: string): Promise<void> {
    const familyMember = await this.getFamilyMemberByIdSimple(id);
    familyMember.isActive = false;
    await this.familyMemberRepository.save(familyMember);
  }

  async createCareProfile(
    createCareProfileDto: CreateCareProfileDto,
    caregiverId: string,
  ): Promise<CareProfile> {
    // Verify caregiver owns this family member
    await this.getFamilyMemberById(
      createCareProfileDto.familyMemberId,
      caregiverId,
    );

    const careProfile = this.careProfileRepository.create({
      ...createCareProfileDto,
    });

    return await this.careProfileRepository.save(careProfile);
  }

  async getCareProfilesByMember(
    familyMemberId: string,
    caregiverId: string,
  ): Promise<CareProfile[]> {
    // Verify caregiver owns this family member
    await this.getFamilyMemberById(familyMemberId, caregiverId);

    return await this.careProfileRepository.find({
      where: { familyMemberId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getCareProfilesByMemberSimple(
    familyMemberId: string,
  ): Promise<CareProfile[]> {
    return await this.careProfileRepository.find({
      where: { familyMemberId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateCareProfile(
    id: string,
    updateData: Partial<CreateCareProfileDto>,
    caregiverId: string,
  ): Promise<CareProfile> {
    const careProfile = await this.careProfileRepository.findOne({
      where: { id },
      relations: ['familyMember'],
    });

    if (!careProfile) {
      throw new NotFoundException('Care profile not found');
    }

    // Verify caregiver owns the family member
    if (careProfile.familyMember.caregiverId !== caregiverId) {
      throw new ForbiddenException(
        'You are not authorized to modify this care profile',
      );
    }

    Object.assign(careProfile, updateData);
    return await this.careProfileRepository.save(careProfile);
  }

  async updateCareProfileSimple(
    id: string,
    updateData: Partial<CreateCareProfileDto>,
  ): Promise<CareProfile> {
    const careProfile = await this.careProfileRepository.findOne({
      where: { id },
    });

    if (!careProfile) {
      throw new NotFoundException('Care profile not found');
    }

    Object.assign(careProfile, updateData);
    return await this.careProfileRepository.save(careProfile);
  }

  async deleteCareProfile(id: string, caregiverId: string): Promise<void> {
    const careProfile = await this.careProfileRepository.findOne({
      where: { id },
      relations: ['familyMember'],
    });

    if (!careProfile) {
      throw new NotFoundException('Care profile not found');
    }

    // Verify caregiver owns the family member
    if (careProfile.familyMember.caregiverId !== caregiverId) {
      throw new ForbiddenException(
        'You are not authorized to delete this care profile',
      );
    }

    careProfile.isActive = false;
    await this.careProfileRepository.save(careProfile);
  }

  async deleteCareProfileSimple(id: string): Promise<void> {
    const careProfile = await this.careProfileRepository.findOne({
      where: { id },
    });

    if (!careProfile) {
      throw new NotFoundException('Care profile not found');
    }

    careProfile.isActive = false;
    await this.careProfileRepository.save(careProfile);
  }
}
