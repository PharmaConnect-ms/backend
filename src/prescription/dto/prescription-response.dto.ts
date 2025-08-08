import { ApiProperty } from '@nestjs/swagger';
import { UserSummaryDto } from '@/prescription/dto/user-summary.dto';

export class PrescriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  prescriptionImage: string;

  @ApiProperty()
  patientName: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: UserSummaryDto })
  doctor: UserSummaryDto;

  @ApiProperty({ type: UserSummaryDto })
  patient: UserSummaryDto;
}
