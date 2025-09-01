import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsDateString, IsNumber, Min, IsBoolean } from 'class-validator';

export class CreateStandaloneMeetingDto {
  @ApiProperty({ example: 'doctor@hospital.com' })
  @IsEmail()
  hostEmail: string;

  @ApiProperty({ example: 'Medical Consultation' })
  @IsString()
  topic: string;

  @ApiProperty({ required: false, example: '2024-09-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiProperty({ required: false, default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiProperty({ required: false, example: 'General medical consultation' })
  @IsOptional()
  @IsString()
  agenda?: string;

  @ApiProperty({ required: false, default: true, description: 'Whether to enable waiting room' })
  @IsOptional()
  @IsBoolean()
  waitingRoom?: boolean;

  @ApiProperty({ required: false, default: true, description: 'Whether to mute participants on entry' })
  @IsOptional()
  @IsBoolean()
  muteOnEntry?: boolean;

  @ApiProperty({ required: false, default: false, description: 'Whether to enable automatic recording' })
  @IsOptional()
  @IsBoolean()
  autoRecord?: boolean;
}
