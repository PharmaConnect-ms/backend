import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { BookStatus } from '../entities/condition-book.entity';

export class CreateConditionBookDto {
  @ApiProperty() @IsString() @IsNotEmpty() patientId: string;
  @ApiProperty() @IsString() @IsNotEmpty() primaryDoctorId: string;

  @ApiProperty({ example: 'Type 2 Diabetes' }) @IsString() @MaxLength(120) title: string;

  @ApiProperty({ enum: ['active','remission','closed'], required: false })
  @IsOptional() @IsEnum(['active','remission','closed'])
  status?: BookStatus;

  @ApiProperty({ required: false }) @IsOptional() @IsDateString() onsetDate?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() severity?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() allergies?: string;

  @ApiProperty({ required: false, description: 'JSON goals array/object' })
  @IsOptional() goals?: any;

  @ApiProperty({ required: false }) @IsOptional() @IsString() instructions?: string;

  @ApiProperty({ default: 30 }) @IsOptional() @IsInt() @Min(1) reviewIntervalDays?: number;
}
