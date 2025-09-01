import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsString, IsNumber, Min } from 'class-validator';
import { FollowUpKind, FollowUpStatus } from '../entities/follow-up.entity';
import { Transform } from 'class-transformer';

export class QueryFollowUpDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bookId?: string;

  @ApiProperty({ enum: ['upcoming', 'completed', 'missed', 'cancelled'], required: false })
  @IsOptional()
  @IsEnum(['upcoming', 'completed', 'missed', 'cancelled'])
  status?: FollowUpStatus;

  @ApiProperty({ enum: ['review', 'lab_review', 'repeat_rx', 'procedure'], required: false })
  @IsOptional()
  @IsEnum(['review', 'lab_review', 'repeat_rx', 'procedure'])
  kind?: FollowUpKind;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueAfter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueBefore?: string;

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
