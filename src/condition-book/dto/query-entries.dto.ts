import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryEntriesDto {
  @ApiPropertyOptional({ enum: ['visit','note','lab','vitals','med_change','imaging','attachment'] })
  @IsOptional() @IsEnum(['visit','note','lab','vitals','med_change','imaging','attachment'])
  type?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;

  @ApiPropertyOptional({ description: 'CSV tags to filter' }) @IsOptional() @IsString() tags?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() cursor?: string;
}
