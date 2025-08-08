import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsPhoneNumber,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreatePrescriptionDto {
  @ApiProperty({
    description:'prescription image URL',
    example: 'https://example.com/prescription.jpg',
  })
  @IsString()
  @IsNotEmpty()
  prescriptionImage: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the patient' })
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @ApiProperty({
    example: 1,
    description: 'Doctor ID (who is issuing the prescription)',
  })
  @IsNumber()
  @IsPositive()
  doctorId: number;

  @ApiProperty({
    example: 5,
    description: 'Patient ID (who is receiving the prescription)',
  })
  @IsNumber()
  @IsPositive()
  patientId: number;
}
