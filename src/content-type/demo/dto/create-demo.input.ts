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
  ValidateNested,
} from 'class-validator';

import { DemoEnumEnum } from './demo.dto';

export class TestId {
  @ApiProperty({ required: true })
  @IsUUID()
  @IsNotEmpty()
  public readonly id: string;
}

export class TestCreateNested {
  @ApiProperty({ required: true })
  @ValidateNested()
  @Type(() => TestId)
  public readonly connect: TestId;
}

@Expose()
export class CreateDemoInput {
  @ApiProperty({ type: 'string', required: true, nullable: true })
  @Matches(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/)
  @IsNotEmpty()
  @MaxLength(255)
  @MinLength(1)
  @IsString()
  @Expose()
  public readonly shortText: string;

  @ApiProperty({ type: 'string', required: true, nullable: true })
  @IsNotEmpty()
  @MaxLength(1000000)
  @MinLength(1000)
  @IsString()
  @Expose()
  public readonly longText: string;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @IsString()
  @IsOptional()
  @Expose()
  public readonly richText: Nullable<string>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @MaxLength(255)
  @IsString()
  @IsOptional()
  @Expose()
  public readonly password: Nullable<string>;

  @ApiProperty({ type: 'number', required: true, nullable: true })
  @Max(32324)
  @Min(1)
  @IsInt()
  @Expose()
  public readonly integer: number;

  @ApiProperty({ type: 'number', required: false, nullable: false })
  @IsInt()
  @IsOptional()
  @Expose()
  public readonly bigint: Nullable<number>;

  @ApiProperty({ type: 'number', required: false, nullable: false })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Expose()
  public readonly decimal: Nullable<number>;

  @ApiProperty({ type: 'number', required: false, nullable: false })
  @IsNumber()
  @IsOptional()
  @Expose()
  public readonly float: Nullable<number>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @IsDateStringISO()
  @IsOptional()
  @Expose()
  public readonly date: Nullable<string>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @IsDateStringISO()
  @IsOptional()
  @Expose()
  public readonly datetime: Nullable<string>;

  @ApiProperty({ type: 'string', required: false, nullable: false })
  @IsDateStringISO()
  @IsOptional()
  @Expose()
  public readonly time: Nullable<string>;

  @ApiProperty({ type: 'boolean', required: false, nullable: false })
  @IsBoolean()
  @IsOptional()
  @Expose()
  public readonly boolean: Nullable<boolean>;

  @ApiProperty({ type: 'object', required: false, nullable: false })
  @IsJSON()
  @IsOptional()
  @Expose()
  public readonly json: Nullable<any>;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: false,
    enum: DemoEnumEnum,
  })
  @IsEnum(DemoEnumEnum)
  @IsOptional()
  @Expose()
  public readonly enum: Nullable<DemoEnumEnum>;

  @ApiProperty({ required: true })
  @ValidateNested()
  @Type(() => TestCreateNested)
  public readonly tests: TestCreateNested;
}
