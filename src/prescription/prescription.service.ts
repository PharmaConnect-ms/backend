import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './entities/prescription.entity';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionResponseDto } from './dto/prescription-response.dto';
import { UserSummaryDto } from '@/prescription/dto/user-summary.dto';

import { User } from '@/users/user.entity';

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private toResponseDto(prescription: Prescription): PrescriptionResponseDto {
    return {
      id: prescription.id,
      prescriptionImage: prescription.prescriptionImage,
      patientName: prescription.patientName,
      createdAt: prescription.createdAt,
      doctor: {
        id: prescription.doctor.id,
        username: prescription.doctor.username,
      },
      patient: {
        id: prescription.patient.id,
        username: prescription.patient.username,
      },
    };
  }

  async create(createPrescriptionDto: CreatePrescriptionDto): Promise<PrescriptionResponseDto> {
    const { prescriptionImage, patientName, doctorId, patientId } = createPrescriptionDto;

    const doctor = await this.userRepository.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException(`Doctor with ID ${doctorId} not found`);

    const patient = await this.userRepository.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException(`Patient with ID ${patientId} not found`);

    const prescription = this.prescriptionRepository.create({
      prescriptionImage,
      patientName,
      doctor,
      patient,
    });

    const saved = await this.prescriptionRepository.save(prescription);
    return this.toResponseDto(saved);
  }

  async findAll(): Promise<PrescriptionResponseDto[]> {
    const prescriptions = await this.prescriptionRepository.find({
      relations: ['doctor', 'patient'],
      order: { createdAt: 'DESC' },
    });

    return prescriptions.map((p) => this.toResponseDto(p));
  }

  async findOne(id: string): Promise<PrescriptionResponseDto> {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id },
      relations: ['doctor', 'patient'],
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${id} not found`);
    }

    return this.toResponseDto(prescription);
  }

  async findByUser(userId: number): Promise<PrescriptionResponseDto[]> {
    const result =  await this.prescriptionRepository.find({
      where: [{ patient: { id: userId } }],
      relations: ['doctor', 'patient'],
      order: { createdAt: 'DESC' },
    });
    if (!result) {
      throw new NotFoundException(`Prescription with ID ${userId} not found`);
    }
    return result.map((p) => this.toResponseDto(p));
  }

  async findByDoctor(userId: number): Promise<PrescriptionResponseDto[]> {
    const prescription = await this.prescriptionRepository.find({
      where: [{ doctor: { id: userId } }],
      relations: ['doctor', 'patient'],
      order: { createdAt: 'DESC' },
    });
    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${userId} not found`);
    }
    return prescription.map((p) => this.toResponseDto(p));
  }

  update(id: number, updatePrescriptionDto: UpdatePrescriptionDto) {
    return `This action updates a #${id} prescription`;
  }

  remove(id: number) {
    return `This action removes a #${id} prescription`;
  }
}
