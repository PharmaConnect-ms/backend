import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsNotEmpty } from 'class-validator';

export class TimelineQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;
}

export class BulkCreateBookEntryDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  entries: any[]; // This would be CreateBookEntryDto[] but we'll handle validation in the service
}
