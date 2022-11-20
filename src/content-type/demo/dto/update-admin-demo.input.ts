import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateAdminDemoInput } from './create-admin-demo.input';

export class UpdateAdminDemoInput extends PartialType(CreateAdminDemoInput) {}
