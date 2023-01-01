import { ApiProperty } from '@nestjs/swagger';
import { Nullable } from '@moonlightjs/common';
import { Expose, Type } from 'class-transformer';
import { TestDto } from '@content-type/test/dto/test.dto';
import { DemoEnumEnum } from './admin-demo.dto';

@Expose()
export class DemoDto {
  @ApiProperty({ type: 'string', required: true })
  @Expose()
  public readonly id: string;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @Expose()
  public readonly richText: Nullable<string>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @Expose()
  public readonly password: Nullable<string>;

  @ApiProperty({ type: 'number', required: false, nullable: false })
  @Expose()
  public readonly bigint: Nullable<number>;

  @ApiProperty({ type: 'number', required: false, nullable: false })
  @Expose()
  public readonly decimal: Nullable<number>;

  @ApiProperty({ type: 'number', required: false, nullable: false })
  @Expose()
  public readonly float: Nullable<number>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @Expose()
  public readonly date: Nullable<string>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @Expose()
  public readonly datetime: Nullable<string>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @Expose()
  public readonly time: Nullable<string>;

  @ApiProperty({ type: 'boolean', required: false, nullable: false })
  @Expose()
  public readonly boolean: Nullable<boolean>;

  @ApiProperty({ type: 'object', required: false, nullable: false })
  @Expose()
  public readonly json: Nullable<any>;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: false,
    enum: DemoEnumEnum,
  })
  @Expose()
  public readonly enum: Nullable<DemoEnumEnum>;

  @ApiProperty({ type: () => TestDto, required: false, nullable: false })
  @Type(() => TestDto)
  @Expose()
  public readonly tests: TestDto;

  @ApiProperty({ type: 'string', required: true })
  @Expose()
  public readonly publishedAt: string;
}
