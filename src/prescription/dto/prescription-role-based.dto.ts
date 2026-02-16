import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsString, IsOptional, IsNumber } from 'class-validator';

/**
 * Role-Based Prescription DTOs
 * Implements field-level authorization for medical records (PHI)
 */

/**
 * Prescription Public DTO
 * Minimal data - should not be visible to public
 */
@Expose()
export class PrescriptionPublicDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @Exclude()
  patientName: string;

  @Exclude()
  prescriptionImage: string;

  @Exclude()
  doctor: any;

  @Exclude()
  patient: any;

  @Exclude()
  updatedAt: Date;
}

/**
 * Prescription Patient DTO
 * Patients can see their own prescriptions but not other patients'
 * Should include doctor information but mask certain fields
 */
@Expose()
export class PrescriptionPatientDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ description: 'Patient name - visible to themselves' })
  @Expose()
  patientName: string;

  @ApiProperty({ description: 'Prescription image/document URL' })
  @Expose()
  prescriptionImage: string;

  @ApiProperty({ description: 'Prescribing doctor information' })
  @Expose()
  doctor: {
    id: number;
    username: string;
    email: string; // Allow patient to see doctor contact info
  };

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional()
  @Expose()
  updatedAt?: Date;

  @Exclude()
  patient: any; // Don't expose full patient object in response
}

/**
 * Prescription Doctor DTO
 * Doctors can see their own prescriptions and those assigned to their patients
 * Full access to medical information
 */
@Expose()
export class PrescriptionDoctorDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ description: 'Patient name - confidential medical info' })
  @Expose()
  patientName: string;

  @ApiProperty({ description: 'Prescription image/document - confidential' })
  @Expose()
  prescriptionImage: string;

  @ApiProperty({ description: 'Patient information' })
  @Expose()
  patient: {
    id: number;
    username: string;
    email: string;
    phone?: string;
    age?: string;
  };

  @ApiProperty({ description: 'Issuing doctor information' })
  @Expose()
  doctor: {
    id: number;
    username: string;
    email: string;
  };

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}

/**
 * Prescription Admin DTO
 * Full access for administrative staff
 */
@Expose()
export class PrescriptionAdminDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  patientName: string;

  @ApiProperty()
  @Expose()
  prescriptionImage: string;

  @ApiProperty()
  @Expose()
  doctor: any;

  @ApiProperty()
  @Expose()
  patient: any;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}

/**
 * Create Prescription DTO
 * Safe DTO for creating prescriptions with input validation
 */
export class CreatePrescriptionSafeDto {
  @ApiProperty()
  @IsString()
  patientName: string;

  @ApiProperty()
  @IsString()
  prescriptionImage: string;

  @ApiProperty()
  @IsNumber()
  doctorId: number;

  @ApiProperty()
  @IsNumber()
  patientId: number;
}

/**
 * Update Prescription DTO
 * Limited update permissions
 */
export class UpdatePrescriptionSafeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prescriptionImage?: string;

  @Exclude()
  patientName?: string; // Cannot modify patient name

  @Exclude()
  doctor?: any; // Cannot reassign prescription

  @Exclude()
  patient?: any; // Cannot reassign prescription
}

/**
 * Prescription List Query DTO
 * For filtering prescriptions with authorization
 */
export class PrescriptionListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  patientId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  doctorId?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  sortBy?: 'createdAt' | 'updatedAt' = 'createdAt';

  @ApiPropertyOptional()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * Role to Prescription DTO mapping
 */
export const JWT_ROLE_TO_PRESCRIPTION_DTO: Record<string, any> = {
  public: PrescriptionPublicDto,
  patient: PrescriptionPatientDto,
  doctor: PrescriptionDoctorDto,
  admin: PrescriptionAdminDto,
  staff: PrescriptionAdminDto,
};

/**
 * Helper to get appropriate prescription DTO based on user role
 */
export function getPrescriptionDtoForRole(role?: string): any {
  return JWT_ROLE_TO_PRESCRIPTION_DTO[role || 'public'] || PrescriptionPublicDto;
}
