import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString } from 'class-validator';

/**
 * Role-Based User DTOs
 * Implements field-level authorization per HIPAA/PHI requirements
 * Different roles see different fields based on access control
 */

/**
 * Public User DTO
 * Minimal data exposure for anonymous/public access
 */
@Expose()
export class UserPublicDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  username: string;

  @ApiPropertyOptional()
  @Expose()
  @Type(() => String)
  profilePicture?: string;

  @ApiPropertyOptional()
  @Expose()
  userSummary?: string;

  // All other fields are excluded by default
  @Exclude()
  password?: string;

  @Exclude()
  email?: string;

  @Exclude()
  phone?: string;

  @Exclude()
  address?: string;

  @Exclude()
  age?: string;
}

/**
 * Patient User DTO
 * Data available to patients (themselves or other patients)
 * Should NOT include sensitive medical or financial data
 */
@Expose()
export class UserPatientDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  username: string;

  @ApiProperty({ description: 'Only visible to the patient themselves or their caregivers' })
  @Expose()
  email: string;

  @ApiPropertyOptional()
  @Expose()
  profilePicture?: string;

  @ApiPropertyOptional()
  @Expose()
  userSummary?: string;

  @ApiPropertyOptional()
  @Expose()
  age?: string;

  @Exclude()
  password?: string;

  @Exclude()
  provider?: string;

  @Exclude()
  address?: string;

  @Exclude()
  phone?: string;

  @Exclude()
  role?: string;
}

/**
 * Doctor User DTO
 * Data available to doctors
 * Includes contact information for patient care
 */
@Expose()
export class UserDoctorDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  username: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  role: string;

  @ApiPropertyOptional()
  @Expose()
  phone?: string;

  @ApiPropertyOptional()
  @Expose()
  profilePicture?: string;

  @ApiPropertyOptional()
  @Expose()
  userSummary?: string;

  @ApiPropertyOptional()
  @Expose()
  age?: string;

  @Exclude()
  password?: string;

  @Exclude()
  address?: string;

  @Exclude()
  provider?: string;
}

/**
 * Admin/Staff User DTO
 * Full data visibility for administrative purposes
 * Used only for internal staff with proper access controls
 */
@Expose()
export class UserAdminDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  username: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  role: string;

  @ApiProperty()
  @Expose()
  provider: string;

  @ApiPropertyOptional()
  @Expose()
  phone?: string;

  @ApiPropertyOptional()
  @Expose()
  address?: string;

  @ApiPropertyOptional()
  @Expose()
  profilePicture?: string;

  @ApiPropertyOptional()
  @Expose()
  userSummary?: string;

  @ApiPropertyOptional()
  @Expose()
  age?: string;

  @Exclude()
  password?: string; // Never expose password in responses
}

/**
 * Auth Response DTO
 * Minimal data returned after authentication
 * Does NOT include sensitive fields
 */
export class AuthResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ description: 'JWT access token' })
  access_token: string;

  @ApiPropertyOptional()
  profilePicture?: string;

  @Exclude()
  password?: string;

  @Exclude()
  phone?: string;

  @Exclude()
  address?: string;

  @Exclude()
  age?: string;
}

/**
 * User Update DTO
 * Only allows updating non-sensitive fields
 */
export class UserUpdateSafeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  age?: string;

  // These fields cannot be updated through this endpoint
  // Password requires separate endpoint with verification
  // Email requires verification
  // Phone should require verification
  // Address/Role cannot be updated by users themselves
  @Exclude()
  password?: string;

  @Exclude()
  email?: string;

  @Exclude()
  phone?: string;

  @Exclude()
  address?: string;

  @Exclude()
  role?: string;
}

/**
 * Sensitive Data Access Request
 * When users need to request access to their own sensitive data (phone, address)
 * Should trigger verification and audit logging
 */
export class SensitiveDataAccessDto {
  @ApiProperty({ description: 'Type of sensitive data requested' })
  dataType: 'phone' | 'address' | 'age' | 'medicalHistory';

  @ApiPropertyOptional()
  @IsOptional()
  reason?: string; // For audit purposes
}

/**
 * Role to DTO mapping for automatic filtering
 */
export const JWT_ROLE_TO_USER_DTO: Record<string, any> = {
  public: UserPublicDto,
  patient: UserPatientDto,
  doctor: UserDoctorDto,
  admin: UserAdminDto,
  staff: UserAdminDto,
};

/**
 * Helper function to get appropriate DTO based on user role
 */
export function getUserDtoForRole(role?: string): any {
  return JWT_ROLE_TO_USER_DTO[role || 'public'] || UserPublicDto;
}
