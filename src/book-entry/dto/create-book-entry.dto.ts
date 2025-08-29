// src/condition-book/dto/create-entry.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EntryType } from '../entities/book-entry.entity';

export class CreateBookEntryDto {
  @ApiProperty() @IsString() @IsNotEmpty() bookId: string;
  @ApiProperty() @IsDateString() entryDate: string;

  @ApiProperty({ enum: ['visit','note','lab','vitals','med_change','imaging','attachment'] })
  @IsEnum(['visit','note','lab','vitals','med_change','imaging','attachment'])
  type: EntryType;

  @ApiProperty() @IsString() @MaxLength(280) summary: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() details?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() attachedFileUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() tags?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() appointmentId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() prescriptionId?: string;

  @ApiProperty({ default: 'doctor', enum: ['doctor','patient','pharmacist'] })
  @IsOptional() @IsEnum(['doctor','patient','pharmacist'])
  uploadedBy?: 'doctor'|'patient'|'pharmacist';
}



