import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateTestInput, DemoId } from './create-test.input';

export class DemoUpdateNested {
  @ApiProperty({ required: false, isArray: true, type: DemoId })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => DemoId)
  set?: DemoId[];
  disconnect?: DemoId[];
  delete?: DemoId[];
  connect?: DemoId[];
}

export class UpdateTestInput extends PartialType(
  OmitType(CreateTestInput, ['demo']),
) {
  @ApiProperty({ required: false })
  @ValidateNested()
  @Type(() => DemoUpdateNested)
  @Expose()
  public readonly Demo: DemoUpdateNested;
}
