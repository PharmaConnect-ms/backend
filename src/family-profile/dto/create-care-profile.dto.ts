import { IsString, IsEnum, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CareTaskType, CareFrequency } from '../entities/care-profile.entity';

export class CreateCareProfileDto {
  @ApiProperty({
    description: 'ID of the user creating this care profile',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  })
  @IsString()
  @IsUUID()
  userId: string;
  @ApiProperty({
    description: 'Title/name of the care task',
    example: 'Morning Medication',
    minLength: 3,
    maxLength: 100
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the care task',
    example: 'Administer insulin injection after checking blood sugar levels',
    minLength: 10,
    maxLength: 500
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Type of care task being performed',
    enum: CareTaskType,
    example: CareTaskType.MEDICATION
  })
  @IsEnum(CareTaskType)
  taskType: CareTaskType;

  @ApiProperty({
    description: 'How frequently this task should be performed',
    enum: CareFrequency,
    example: CareFrequency.DAILY
  })
  @IsEnum(CareFrequency)
  frequency: CareFrequency;

  @ApiPropertyOptional({
    description: 'Specific time of day to perform the task (HH:MM format)',
    example: '08:00',
    pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
  })
  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @ApiPropertyOptional({
    description: 'Days of the week when this task should be performed',
    example: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  daysOfWeek?: string[];

  @ApiPropertyOptional({
    description: 'Detailed instructions for performing this care task',
    example: 'Always check blood sugar levels before administering insulin. Record readings in logbook.',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({
    description: 'UUID of the family member this care profile belongs to',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid'
  })
  @IsUUID()
  familyMemberId: string;
}
