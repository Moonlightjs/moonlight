import { ApiProperty } from '@nestjs/swagger';
import { Nullable } from '@moonlightjs/common';
import { Expose, Type } from 'class-transformer';
import { DemoDto } from '@content-type/demo/dto/demo.dto';
import { TestEnumEnum } from './admin-test.dto';

@Expose()
export class TestDto {
  @ApiProperty({ type: 'string', required: true })
  @Expose()
  public readonly id: string;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @Expose()
  public readonly date: Nullable<string>;

  @ApiProperty({
    type: () => DemoDto,
    required: false,
    nullable: false,
    isArray: true,
  })
  @Type(() => DemoDto)
  @Expose()
  public readonly demo: DemoDto[];

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: false,
    enum: TestEnumEnum,
  })
  @Expose()
  public readonly enum: Nullable<TestEnumEnum>;

  @ApiProperty({ type: 'object', required: false, nullable: false })
  @Expose()
  public readonly json: Nullable<any>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @Expose()
  public readonly time: Nullable<string>;

  @ApiProperty({ type: 'number', required: false, nullable: false })
  @Expose()
  public readonly float: Nullable<number>;

  @ApiProperty({ type: 'number', required: false, nullable: false })
  @Expose()
  public readonly bigint: Nullable<number>;

  @ApiProperty({ type: 'boolean', required: false, nullable: false })
  @Expose()
  public readonly boolean: Nullable<boolean>;

  @ApiProperty({ type: 'number', required: false, nullable: false })
  @Expose()
  public readonly decimal: Nullable<number>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @Expose()
  public readonly datetime: Nullable<string>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @Expose()
  public readonly password: Nullable<string>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @Expose()
  public readonly richText: Nullable<string>;
}
