import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FollowUpKind } from '../entities/follow-up.entity';

export class CreateFollowUpDto {
  @ApiProperty() @IsString() @IsNotEmpty() bookId: string;
  @ApiProperty() @IsDateString() dueAt: string;

  @ApiProperty({ enum: ['review','lab_review','repeat_rx','procedure'], default: 'review' })
  @IsOptional() @IsEnum(['review','lab_review','repeat_rx','procedure'])
  kind?: FollowUpKind;

  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsDateString() remindAt1?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() remindAt2?: string;
  @ApiProperty({ required: false, enum: ['push','sms','email'] })
  @IsOptional() @IsEnum(['push','sms','email'])
  channel?: 'push'|'sms'|'email';
}
