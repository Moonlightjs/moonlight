import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateTestInput } from './create-test.input';
import { DemoUpdateNested } from './update-admin-test.input';

export class UpdateTestInput extends PartialType(
  OmitType(CreateTestInput, ['demo']),
) {
  @ApiProperty({ required: false })
  @ValidateNested()
  @Type(() => DemoUpdateNested)
  @Expose()
  public readonly Demo: DemoUpdateNested;
}
