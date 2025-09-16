import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateFamilyMemberDto as BaseUpdateFamilyMemberDto } from './update-family-member.dto';

export class UpdateFamilyMemberWithUserDto extends BaseUpdateFamilyMemberDto {
  @ApiProperty({
    description: 'ID of the user updating this family member',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  })
  @IsString()
  @IsUUID()
  userId: string;
}

export class UpdateCareProfileWithUserDto {
  @ApiProperty({
    description: 'ID of the user updating this care profile',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Title/name of the care task',
    example: 'Evening Medication',
    required: false
  })
  title?: string;

  @ApiProperty({
    description: 'Detailed description of the care task',
    example: 'Updated care instructions',
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'Specific time of day to perform the task (HH:MM format)',
    example: '20:00',
    required: false
  })
  scheduledTime?: string;

  @ApiProperty({
    description: 'Additional care instructions or notes',
    example: 'Check with doctor first',
    required: false
  })
  instructions?: string;
}

export class DeleteRequestDto {
  @ApiProperty({
    description: 'ID of the user making the delete request',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  })
  @IsString()
  @IsUUID()
  userId: string;
}
