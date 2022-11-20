import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateAdminTestInput, DemoId } from './create-admin-test.input';

export class DemoUpdateNested {
  @ApiProperty({ required: false, isArray: true, type: DemoId })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => DemoId)
  set?: DemoId[];
  @ApiProperty({ required: false, isArray: true, type: DemoId })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => DemoId)
  disconnect?: DemoId[];
  @ApiProperty({ required: false, isArray: true, type: DemoId })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => DemoId)
  delete?: DemoId[];
  @ApiProperty({ required: false, isArray: true, type: DemoId })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => DemoId)
  connect?: DemoId[];
}

export class UpdateAdminTestInput extends PartialType(
  OmitType(CreateAdminTestInput, ['demo']),
) {
  @ApiProperty({ required: false })
  @ValidateNested()
  @Type(() => DemoUpdateNested)
  @Expose()
  public readonly Demo: DemoUpdateNested;
}
