import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateDemoInput } from './create-demo.input';

export class UpdateDemoInput extends PartialType(CreateDemoInput) {}
