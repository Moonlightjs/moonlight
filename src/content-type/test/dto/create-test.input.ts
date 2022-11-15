import { ApiProperty } from '@nestjs/swagger';
import { IsDateStringISO, Nullable } from '@moonlightjs/common';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsJSON,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { TestEnumEnum } from './test.dto';

@Expose()
export class CreateTestInput {
  @ApiProperty({ type: 'string', required: true, nullable: true })
  @Matches(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/)
  @IsNotEmpty()
  @MaxLength(255)
  @MinLength(1)
  @IsString()
  @IsOptional()
  @Expose()
  public readonly shortText: string;

  @ApiProperty({ type: 'string', required: true, nullable: true })
  @IsNotEmpty()
  @MaxLength(1000000)
  @MinLength(1000)
  @IsString()
  @IsOptional()
  @Expose()
  public readonly longText: string;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @IsString()
  @Expose()
  public readonly richText: Nullable<string>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @MaxLength(255)
  @IsString()
  @Expose()
  public readonly password: Nullable<string>;

  @ApiProperty({ type: 'number', required: true, nullable: true })
  @Max(32324)
  @Min(1)
  @IsInt()
  @IsOptional()
  @Expose()
  public readonly integer: number;

  @ApiProperty({ type: 'number', required: false, nullable: false })
  @IsInt()
  @Expose()
  public readonly bigint: Nullable<number>;

  @ApiProperty({ type: 'number', required: false, nullable: false })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Expose()
  public readonly decimal: Nullable<number>;

  @ApiProperty({ type: 'number', required: false, nullable: false })
  @IsNumber()
  @Expose()
  public readonly float: Nullable<number>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @IsDateStringISO()
  @Expose()
  public readonly date: Nullable<string>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @IsDateStringISO()
  @Expose()
  public readonly datetime: Nullable<string>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @IsDateStringISO()
  @Expose()
  public readonly time: Nullable<string>;

  @ApiProperty({ type: 'boolean', required: false, nullable: false })
  @IsBoolean()
  @Expose()
  public readonly boolean: Nullable<boolean>;

  @ApiProperty({ type: 'boolean', required: false, nullable: false })
  @IsBoolean()
  @Expose()
  public readonly json: Nullable<boolean>;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: false,
    enum: TestEnumEnum,
  })
  @IsEnum(TestEnumEnum)
  @Expose()
  public readonly enum: Nullable<TestEnumEnum>;
}
