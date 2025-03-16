import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiBody, ApiResponse, ApiProperty } from '@nestjs/swagger';

class PrescriptionDto {
  @ApiProperty({ example: 123, description: 'ID of the patient' })
  patientId: number;

  @ApiProperty({ example: 456, description: 'ID of the doctor prescribing' })
  doctorId: number;

  @ApiProperty({
    example: [
      { name: 'Paracetamol', dosage: '500mg', frequency: '3 times a day' }
    ],
    description: 'List of prescribed medicines',
    type: 'array',
    items: { type: 'object', properties: {
      name: { type: 'string' },
      dosage: { type: 'string' },
      frequency: { type: 'string' }
    }}
  })
  medicines: { name: string; dosage: string; frequency: string }[];

  @ApiProperty({ example: 'Take after meals', description: 'Additional notes' })
  notes: string;
}

@ApiTags('Prescriptions') 
@ApiBearerAuth() 
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBody({ type: PrescriptionDto }) 
  @ApiResponse({ status: 201, description: 'Prescription created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPrescription(@Body() prescriptionDto: PrescriptionDto) {
    return this.prescriptionsService.create(prescriptionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiResponse({ status: 200, description: 'Returns all prescriptions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllPrescriptions() {
    return this.prescriptionsService.findAll();
  }
}
