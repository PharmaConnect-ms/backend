import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsString, IsNumber, Min, IsArray } from 'class-validator';
import { EntryType } from '../entities/book-entry.entity';
import { Transform } from 'class-transformer';

export class QueryBookEntryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bookId?: string;

  @ApiProperty({ enum: ['visit', 'note', 'lab', 'vitals', 'med_change', 'imaging', 'attachment'], required: false })
  @IsOptional()
  @IsEnum(['visit', 'note', 'lab', 'vitals', 'med_change', 'imaging', 'attachment'])
  type?: EntryType;

  @ApiProperty({ enum: ['doctor', 'patient', 'pharmacist', 'admin'], required: false })
  @IsOptional()
  @IsEnum(['doctor', 'patient', 'pharmacist', 'admin'])
  uploadedBy?: 'doctor' | 'patient' | 'pharmacist' | 'admin';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  entryAfter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  entryBefore?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  prescriptionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false, minimum: 1, default: 50 })
  @IsOptional()
  @Transform(({ value }) => {
    const num = parseInt(String(value), 10);
    return isNaN(num) ? 50 : num;
  })
  @IsNumber()
  @Min(1)
  limit?: number = 50;

  @ApiProperty({ required: false, minimum: 0, default: 0 })
  @IsOptional()
  @Transform(({ value }) => {
    const num = parseInt(String(value), 10);
    return isNaN(num) ? 0 : num;
  })
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}
