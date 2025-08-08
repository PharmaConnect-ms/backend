import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

@ApiTags('Prescriptions') // Swagger group
@Controller('prescription')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new prescription' })
  @ApiResponse({ status: 201, description: 'Prescription created successfully.' })
  create(@Body() createPrescriptionDto: CreatePrescriptionDto) {
    return this.prescriptionService.create(createPrescriptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all prescriptions' })
  findAll() {
    return this.prescriptionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a prescription by ID' })
  findOne(@Param('id') id: string) {
    return this.prescriptionService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get prescriptions by user ID' })
  findByUser(@Param('userId') userId: number) {
    return this.prescriptionService.findByUser(userId);
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Get prescriptions by doctor ID' })
  findByDoctor(@Param('doctorId') doctorId: number) {
    return this.prescriptionService.findByDoctor(doctorId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a prescription by ID' })
  update(@Param('id') id: string, @Body() updatePrescriptionDto: UpdatePrescriptionDto) {
    return this.prescriptionService.update(+id, updatePrescriptionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a prescription by ID' })
  remove(@Param('id') id: string) {
    return this.prescriptionService.remove(+id);
  }
}
