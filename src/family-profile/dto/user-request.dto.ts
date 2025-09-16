import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserRequestDto {
  @ApiProperty({
    description: 'ID of the user making the request',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  })
  @IsString()
  @IsUUID()
  userId: string;
}
