import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
@ApiTags('Prescriptions')
@Controller('prescription')
export class PrescriptionController {
  constructor(
    private readonly prescriptionService: PrescriptionService,
  ) {}

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

  @Post('add-prescription')
  @ApiOperation({ summary: 'Upload an image for processing' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = /image\/(png|jpeg|jpg|webp|heic|heif|gif|bmp|tiff)/i.test(file.mimetype);
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
        patientName: { type: 'string' },
        doctorId: { type: 'number' },
        patientId: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successful image upload',
    schema: { example: { answer: { message: '...', file: { name: '...', url: '...' } } } },
  })
  async addPrescription(@UploadedFile() file: Express.Multer.File, @Body('patientName') patientName: string, @Body('doctorId') doctorId: number, @Body('patientId') patientId: number) {
    if (!file) throw new BadRequestException('Image file is required');
    const results =  await this.prescriptionService.addPrescription(file, patientName, doctorId, patientId);

    return { message: 'Prescription added successfully', data: results };
  }
}
