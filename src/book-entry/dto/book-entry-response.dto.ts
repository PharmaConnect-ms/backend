import { ApiProperty } from '@nestjs/swagger';
import { EntryType } from '../entities/book-entry.entity';

export class BookEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bookId: string;

  @ApiProperty()
  entryDate: Date;

  @ApiProperty({ enum: ['visit', 'note', 'lab', 'vitals', 'med_change', 'imaging', 'attachment'] })
  type: EntryType;

  @ApiProperty()
  summary: string;

  @ApiProperty({ required: false })
  details?: string;

  @ApiProperty({ required: false })
  attachedFileUrl?: string;

  @ApiProperty({ required: false })
  tags?: string;

  @ApiProperty({ required: false })
  appointmentId?: string;

  @ApiProperty({ required: false })
  prescriptionId?: string;

  @ApiProperty({ enum: ['doctor', 'patient', 'pharmacist', 'admin'] })
  uploadedBy: 'doctor' | 'patient' | 'pharmacist' | 'admin';

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class BookEntryStatisticsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  byType: Record<EntryType, number>;

  @ApiProperty()
  byUploadedBy: Record<string, number>;

  @ApiProperty()
  recentCount: number;
}
