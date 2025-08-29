import { PartialType } from '@nestjs/swagger';
import { CreateConditionBookDto } from './create-condition-book.dto';

export class UpdateConditionBookDto extends PartialType(CreateConditionBookDto) {}
