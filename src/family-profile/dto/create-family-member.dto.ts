import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RelationshipType, CareLevel } from '../entities/family-member.entity';

export class CreateFamilyMemberDto {
  @ApiProperty({
    description: 'ID of the user creating this family member profile',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  })
  @IsString()
  @IsUUID()
  userId: string;
  @ApiProperty({
    description: 'Full name of the family member',
    example: 'John Doe Jr.',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Current age of the family member',
    example: 8,
    minimum: 0,
    maximum: 120
  })
  @IsNumber()
  @Min(0)
  @Max(120)
  age: number;

  @ApiPropertyOptional({
    description: 'Date of birth in ISO format',
    example: '2016-05-15',
    format: 'date'
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Relationship to the caregiver',
    enum: RelationshipType,
    example: RelationshipType.CHILD
  })
  @IsEnum(RelationshipType)
  relationship: RelationshipType;

  @ApiPropertyOptional({
    description: 'Level of care required',
    enum: CareLevel,
    example: CareLevel.ASSISTED,
    default: CareLevel.INDEPENDENT
  })
  @IsOptional()
  @IsEnum(CareLevel)
  careLevel?: CareLevel;

  @ApiPropertyOptional({
    description: 'Medical notes and important health information',
    example: 'Requires daily insulin injection. Monitor blood sugar levels.'
  })
  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @ApiPropertyOptional({
    description: 'List of known allergies',
    example: ['peanuts', 'shellfish', 'dairy'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({
    description: 'List of current medications',
    example: ['insulin', 'vitamins', 'aspirin'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];
}
