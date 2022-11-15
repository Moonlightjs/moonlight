import {
  CollationTypeAttribute,
  CollationTypeAttributeBoolean,
  CollationTypeAttributeCommon,
  CollationTypeAttributeString,
  CollationTypeAttributeType,
} from '@modules/content-type-builder/collation-type';
import { CreateContentTypeBuilderInput } from '@modules/content-type-builder/dto/create-content-type-builder.input';
import { BadRequestException, Injectable } from '@nestjs/common';
import { pascalCase, paramCase, camelCase, constantCase } from 'change-case';
import * as fs from 'fs-extra';
import {
  CollationTypeAttributeDate,
  CollationTypeAttributeEnumeration,
} from './collation-type';
import {
  CollationTypeAttributeNumber,
  CollationTypeAttributeDecimal,
} from './collation-type';
import { exec, spawn } from 'child_process';
@Injectable()
export class ContentTypeBuilderService {
  create(input: CreateContentTypeBuilderInput) {
    generateContentTypeSchema(input);
    generateContentTypeModule(input);
    const rootFolder = process.env.ROOT_FOLDER;
    exec(`cd ${rootFolder} && npm run aurora`, (error, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);
      if (error !== null) {
        console.log(`exec error: ${error}`);
      }
    });
    exec(
      `cd ${rootFolder} && npx prisma migrate dev --name="create-${paramCase(
        input.displayName,
      )}-model"`,
      (error, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (error !== null) {
          console.log(`exec error: ${error}`);
        }
      },
    );
    const shell = spawn(
      `echo 'y' | cd ${rootFolder} && npx prisma migrate dev --name="create-${paramCase(
        input.displayName,
      )}-model"`,
      [],
      { stdio: 'inherit', shell: true },
    );

    shell.on('error', (error) => {
      console.log(`error: ${error.message}`);
    });

    shell.on('close', (code) => {
      console.log('[shell] terminated :', code);
    });

    exec(`cd ${rootFolder} && npm run format`, (error, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);
      if (error !== null) {
        console.log(`exec error: ${error}`);
      }
    });
  }
}

const generateContentTypeSchema = (input: CreateContentTypeBuilderInput) => {
  const rootFolder = process.env.ROOT_FOLDER;
  console.log(rootFolder);
  try {
    // remove schema file if it exists
    fs.removeSync(
      `${rootFolder}/prisma/schemas/${paramCase(input.displayName)}.prisma`,
    );
  } catch (err) {
    console.warn(err);
  }

  fs.mkdirSync(`${rootFolder}/prisma/schemas`, {
    recursive: true,
  });
  fs.writeFileSync(
    `${rootFolder}/prisma/schemas/${paramCase(input.displayName)}.prisma`,
    generateContentTypeSchemaContent(input),
    {
      encoding: 'utf-8',
    },
  );
};

const generateContentTypeSchemaContent = (
  input: CreateContentTypeBuilderInput,
) => {
  let schemaAttribute = '';
  let enumTxt = '';
  Object.keys(input.attributes).forEach((attributeName, index) => {
    const attribute = input.attributes[attributeName];

    if (attribute.type === 'enumeration') {
      const attributeEnum = attribute as CollationTypeAttributeEnumeration;
      enumTxt += `\n
enum ${pascalCase(input.displayName)}${pascalCase(attributeName)} {
  ${attributeEnum.enum.join('\n  ')}
}`;
    }
    if (index !== 0) schemaAttribute += '\n';
    let property = `  ${attributeName} `;
    property +=
      ' ' +
      generateSchemeAttributeType(attribute, attributeName, input.displayName);
    property += '' + generateSchemeAttributeRequired(attribute.required);
    property += ' ' + generateSchemeAttributeNativeType(attribute);
    schemaAttribute += property;
  });
  const schemaTemplate = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
${enumTxt}

model ${input.displayName} {
  id String @id @default(uuid()) @db.Uuid()
    
${schemaAttribute}

  createdAt          DateTime                  @default(now()) @db.Timestamptz()
  createdById        String?                   @db.Uuid()
  createdBy          String?
  updatedAt          DateTime                  @updatedAt @db.Timestamptz()
  updatedById        String?                   @db.Uuid()
  updatedBy          String?
  deletedAt          DateTime?                 @db.Timestamptz()
  deletedById        String?                   @db.Uuid()
  deletedBy          String?
}`;
  return schemaTemplate;
};

const generateSchemeAttributeType = (
  attribute: CollationTypeAttribute,
  attributeName: string,
  modelName: string,
) => {
  switch (attribute.type) {
    case 'string':
    case 'password':
    case 'text':
    case 'richtext':
      return 'String';
    case 'integer':
      return 'Int';
    case 'bigint':
      return 'BigInt';
    case 'float':
      return 'Float';
    case 'decimal':
      return 'Decimal';
    case 'boolean':
      return 'Boolean';
    case 'json':
      return 'Json';
    case 'date':
    case 'datetime':
    case 'time':
      return 'DateTime';
    case 'enumeration':
      return `${pascalCase(modelName)}${pascalCase(attributeName)}`;
    default:
      throw new BadRequestException(
        `Current attribute type ${attribute.type} is not supported`,
      );
  }
};

const generateSchemeAttributeRequired = (required: boolean) => {
  if (required) {
    return '';
  }
  return '?';
};

const generateSchemeAttributeNativeType = (
  attribute: CollationTypeAttribute,
) => {
  switch (attribute.type) {
    case 'string': {
      let txt = '@db.VarChar(255)';
      const attributeStr = attribute as CollationTypeAttributeString;
      if (attributeStr.maxLength) {
        txt = `@db.VarChar(${attributeStr.maxLength})`;
      }
      if (attributeStr.unique) {
        txt += ' @unique';
      }
      if (attributeStr.default) {
        txt += ` @default("${attributeStr.default}")`;
      }
      return txt;
    }
    case 'password':
      return '@db.VarChar(255)';
    case 'text':
    case 'richtext': {
      let txt = '@db.Text';
      const attributeStr = attribute as CollationTypeAttributeString;
      if (attributeStr.unique) {
        txt += ' @unique';
      }
      if (attributeStr.default) {
        txt += ` @default("${attributeStr.default}")`;
      }
      return txt;
    }
    case 'integer': {
      let txt = '';
      const attributeNumber = attribute as CollationTypeAttributeNumber;
      if (attributeNumber.unique) {
        txt += ' @unique';
      }
      if (attributeNumber.default) {
        txt += ` @default(${attributeNumber.default})`;
      }
      return txt;
    }
    case 'bigint': {
      let txt = '';
      const attributeNumber = attribute as CollationTypeAttributeNumber;
      if (attributeNumber.unique) {
        txt += ' @unique';
      }
      if (attributeNumber.default) {
        txt += ` @default(${attributeNumber.default})`;
      }
      return txt;
    }
    case 'float': {
      let txt = '';
      const attributeNumber = attribute as CollationTypeAttributeNumber;
      if (attributeNumber.unique) {
        txt += ' @unique';
      }
      if (attributeNumber.default) {
        txt += ` @default(${attributeNumber.default})`;
      }
      return txt;
    }
    case 'decimal': {
      const attributeDecimal = attribute as CollationTypeAttributeDecimal;
      let txt = `@db.Decimal(${attributeDecimal.precision}, ${attributeDecimal.scale})`;
      if (attributeDecimal.unique) {
        txt += ' @unique';
      }
      if (attributeDecimal.default) {
        txt += ` @default(${attributeDecimal.default})`;
      }
      return txt;
    }
    case 'boolean': {
      let txt = '';
      const attributeBoolean = attribute as CollationTypeAttributeBoolean;
      if (attributeBoolean.unique) {
        txt += ' @unique';
      }
      if (attributeBoolean.default) {
        txt += ` @default(${attributeBoolean.default})`;
      }
      return txt;
    }
    case 'json':
      return '@db.JsonB';
    case 'date': {
      let txt = '@db.Date';
      const attributeBoolean = attribute as CollationTypeAttributeDate;
      if (attributeBoolean.unique) {
        txt += ' @unique';
      }
      if (attributeBoolean.default) {
        txt += ` @default(${attributeBoolean.default})`;
      }
      return txt;
    }
    case 'datetime': {
      let txt = '@db.Timestamp()';
      const attributeBoolean = attribute as CollationTypeAttributeDate;
      if (attributeBoolean.unique) {
        txt += ' @unique';
      }
      if (attributeBoolean.default) {
        txt += ` @default(${attributeBoolean.default})`;
      }
      return txt;
    }
    case 'time': {
      let txt = '@db.Time()';
      const attributeBoolean = attribute as CollationTypeAttributeDate;
      if (attributeBoolean.unique) {
        txt += ' @unique';
      }
      if (attributeBoolean.default) {
        txt += ` @default(${attributeBoolean.default})`;
      }
      return txt;
    }
    case 'enumeration':
      let txt = '';
      const attributeEnum = attribute as CollationTypeAttributeEnumeration;
      if (attributeEnum.unique) {
        txt += ' @unique';
      }
      if (attributeEnum.default) {
        txt += ` @default(${attributeEnum.default})`;
      }
      return txt;
    default:
      throw new BadRequestException('Current attribute type is not supported');
  }
};

const generateContentTypeModule = (input: CreateContentTypeBuilderInput) => {
  const rootFolder = process.env.ROOT_FOLDER;
  try {
    // remove content-type folder if it exists
    fs.removeSync(
      `${rootFolder}/src/content-type/${paramCase(input.displayName)}`,
    );
  } catch (err) {
    console.warn(err);
  }

  fs.mkdirSync(
    `${rootFolder}/src/content-type/${paramCase(input.displayName)}/dto`,
    {
      recursive: true,
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(input.displayName)}/${paramCase(
      input.displayName,
    )}.module.ts`,
    generateContentTypeModuleContent(input),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(input.displayName)}/${paramCase(
      input.displayName,
    )}.controller.ts`,
    generateContentTypeControllerContent(input),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(input.displayName)}/${paramCase(
      input.displayName,
    )}.service.ts`,
    generateContentTypeServiceContent(input),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      input.displayName,
    )}/dto/${paramCase(input.displayName)}.dto.ts`,
    generateContentTypeDtoContent(input),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      input.displayName,
    )}/dto/create-${paramCase(input.displayName)}.input.ts`,
    generateContentTypeCreateInputContent(input),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      input.displayName,
    )}/dto/update-${paramCase(input.displayName)}.input.ts`,
    generateContentTypeUpdateInputContent(input),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      input.displayName,
    )}/dto/index.ts`,
    generateContentTypeDtoIndexContent(input),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(input.displayName)}/index.ts`,
    generateContentTypeModuleIndexContent(input),
    {
      encoding: 'utf-8',
    },
  );
};

const generateContentTypeModuleContent = (
  input: CreateContentTypeBuilderInput,
) => {
  const template = `import { Module } from '@nestjs/common';
import { ${pascalCase(input.displayName)}Service } from './${paramCase(
    input.displayName,
  )}.service';
import { ${pascalCase(input.displayName)}Controller } from './${paramCase(
    input.displayName,
  )}.controller';

@Module({
  controllers: [${pascalCase(input.displayName)}Controller],
  providers: [${pascalCase(input.displayName)}Service],
  exports: [${pascalCase(input.displayName)}Service],
})
export class ${pascalCase(input.displayName)}Module {}
`;
  return template;
};

const generateContentTypeControllerContent = (
  input: CreateContentTypeBuilderInput,
) => {
  const template = `
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import {
  OpenApiResponse,
  FindManyArgs,
  OpenApiPaginationResponse,
  FindOneArgs,
  SuccessResponseDto,
} from '@moonlightjs/common';
import { ${pascalCase(input.displayName)}Dto } from './dto/${paramCase(
    input.displayName,
  )}.dto';
import { ${pascalCase(input.displayName)}Service } from './${paramCase(
    input.displayName,
  )}.service';
import { Update${pascalCase(
    input.displayName,
  )}Input } from './dto/update-${paramCase(input.displayName)}.input';
import { Create${pascalCase(
    input.displayName,
  )}Input } from './dto/create-${paramCase(input.displayName)}.input';

@ApiTags('${input.displayName}')
@Controller({
  path: '${paramCase(input.displayName)}',
  version: '1',
})
// @UseGuards(JwtAuthGuard)
export class ${pascalCase(input.displayName)}Controller {
  constructor(protected readonly ${camelCase(
    input.displayName,
  )}Service: ${pascalCase(input.displayName)}Service) {}

  @ApiBody({
    type: Create${pascalCase(input.displayName)}Input,
  })
  @OpenApiResponse({
    status: HttpStatus.CREATED,
    model: ${pascalCase(input.displayName)}Dto,
  })
  @Post()
  create(
    @Body() create${pascalCase(input.displayName)}Input: Create${pascalCase(
    input.displayName,
  )}Input,
    @Query() params: Omit<Prisma.${pascalCase(
      input.displayName,
    )}CreateArgs, 'data'>,
  ) {
    return this.${camelCase(input.displayName)}Service.create({
      ...params,
      data: {
        ...create${pascalCase(input.displayName)}Input
      },
    });
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiResponse({
    status: HttpStatus.OK,
    model: ${pascalCase(input.displayName)}Dto,
    isArray: true,
  })
  @Get()
  findAll(@Query() params: Prisma.${pascalCase(
    input.displayName,
  )}FindManyArgs) {
    return this.${camelCase(input.displayName)}Service.findAll(params);
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiPaginationResponse(${pascalCase(input.displayName)}Dto)
  @Get('/pagination')
  findAllPagination(@Query() params: Prisma.${pascalCase(
    input.displayName,
  )}FindManyArgs) {
    return this.${camelCase(
      input.displayName,
    )}Service.findAllPagination(params);
  }

  @ApiQuery({
    type: FindOneArgs,
  })
  @OpenApiResponse({ status: HttpStatus.OK, model: ${pascalCase(
    input.displayName,
  )}Dto })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query() params: Prisma.${pascalCase(input.displayName)}FindUniqueArgs,
  ) {
    params.where = {
      id,
    };
    return this.${camelCase(input.displayName)}Service.findOne(params);
  }

  @OpenApiResponse({ status: HttpStatus.OK, model: ${pascalCase(
    input.displayName,
  )}Dto })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() update${pascalCase(input.displayName)}Input: Update${pascalCase(
    input.displayName,
  )}Input,
    @Query() params: Omit<Prisma.${pascalCase(
      input.displayName,
    )}UpdateArgs, 'data' | 'where'>,
  ) {
    return this.${camelCase(input.displayName)}Service.update({
      ...params,
      where: {
        id,
      },
      data: {
        ...update${pascalCase(input.displayName)}Input,
      },
    });
  }

  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDto })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${camelCase(input.displayName)}Service.remove({
      id,
    });
  }
}
`;
  return template;
};

const generateContentTypeServiceContent = (
  input: CreateContentTypeBuilderInput,
) => {
  const template = `
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PagedResultDto,
  Pagination,
  toDto,
  HttpErrorException,
} from '@moonlightjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ${pascalCase(input.displayName)}Dto } from './dto/${paramCase(
    input.displayName,
  )}.dto';
import { Update${pascalCase(
    input.displayName,
  )}Input } from './dto/update-${paramCase(input.displayName)}.input';
import { Create${pascalCase(
    input.displayName,
  )}Input } from './dto/create-${paramCase(input.displayName)}.input';

const DEFAULT_SKIP = 0;
const DEFAULT_TAKE = 20;

@Injectable()
export class ${pascalCase(input.displayName)}Service {
  constructor(
    protected prisma: PrismaService
  ) {}

  async findOne(params: Prisma.${pascalCase(
    input.displayName,
  )}FindFirstArgs) : Promise<${pascalCase(input.displayName)}Dto> {
    const ${camelCase(input.displayName)} = await this.prisma.${camelCase(
    input.displayName,
  )}.findFirst(params);
    return toDto<${pascalCase(input.displayName)}Dto>(${pascalCase(
    input.displayName,
  )}Dto, ${camelCase(input.displayName)});
  }

  async findAll(params: Prisma.${pascalCase(
    input.displayName,
  )}FindManyArgs): Promise<${pascalCase(input.displayName)}Dto[]> {
    params.skip = params.skip ?? DEFAULT_SKIP;
    params.take = params.take ?? DEFAULT_TAKE;
    const ${camelCase(input.displayName)}s = await this.prisma.${camelCase(
    input.displayName,
  )}.findMany(params);
    return ${camelCase(input.displayName)}s.map((${camelCase(
    input.displayName,
  )}) => toDto<${pascalCase(input.displayName)}Dto>(${pascalCase(
    input.displayName,
  )}Dto, ${camelCase(input.displayName)}));
  }

  async findAllPagination(
    params: Prisma.${pascalCase(input.displayName)}FindManyArgs,
  ): Promise<PagedResultDto<${pascalCase(input.displayName)}Dto>> {
    params.skip = params.skip ?? DEFAULT_SKIP;
    params.take = params.take ?? DEFAULT_TAKE;
    const [${camelCase(input.displayName)}s, total] = await Promise.all([
      this.prisma.${camelCase(input.displayName)}.findMany(params),
      this.prisma.${camelCase(input.displayName)}.count({
        where: params.where,
      }),
    ]);
    return PagedResultDto.create({
      data: ${camelCase(input.displayName)}s.map((${camelCase(
    input.displayName,
  )}) => toDto<${pascalCase(input.displayName)}Dto>(${pascalCase(
    input.displayName,
  )}Dto, ${camelCase(input.displayName)})),
      pagination: Pagination.create({
        take: params.take,
        skip: params.skip,
        total: total,
      }),
    });
  }

  async create(params: Prisma.${pascalCase(
    input.displayName,
  )}CreateArgs): Promise<${pascalCase(input.displayName)}Dto> {
    const ${camelCase(input.displayName)} = await this.prisma.${camelCase(
    input.displayName,
  )}.create(params);
    return toDto<${pascalCase(input.displayName)}Dto>(${pascalCase(
    input.displayName,
  )}Dto, ${camelCase(input.displayName)});
  }

  async update(params: Prisma.${pascalCase(
    input.displayName,
  )}UpdateArgs): Promise<${pascalCase(input.displayName)}Dto> {
    const ${camelCase(input.displayName)} = await this.prisma.${camelCase(
    input.displayName,
  )}.update(params);
    return toDto<${pascalCase(input.displayName)}Dto>(${pascalCase(
    input.displayName,
  )}Dto, ${camelCase(input.displayName)});
  }

  async remove(where: Prisma.${pascalCase(
    input.displayName,
  )}WhereUniqueInput): Promise<boolean> {
    const ${camelCase(input.displayName)} = await this.prisma.${camelCase(
    input.displayName,
  )}.delete({
      where,
    });
    return !!${camelCase(input.displayName)};
  }
}`;
  return template;
};

const generateContentTypeDtoContent = (
  input: CreateContentTypeBuilderInput,
) => {
  let attributeTxt = '';
  let enumTxt = '';
  Object.keys(input.attributes).forEach((attributeName, index) => {
    const attribute = input.attributes[attributeName];

    if (attribute.type === 'enumeration') {
      const attributeEnum = attribute as CollationTypeAttributeEnumeration;
      enumTxt += `
export enum ${pascalCase(input.displayName)}${pascalCase(attributeName)}Enum {
  ${attributeEnum.enum
    .map((value) => {
      return `${constantCase(value)} = '${value}',`;
    })
    .join('\n')}
}`;
    }

    if (index !== 0) attributeTxt += '\n';
    const property = `
@ApiProperty({ type: '${generateOpenApiType(attribute)}',${
      attribute.required ? 'required: true, ' : 'required: false, '
    }${attribute.required ? 'nullable: true, ' : 'nullable: false, '}${
      attribute.type === 'enumeration'
        ? ` enum: ${pascalCase(input.displayName)}${pascalCase(
            attributeName,
          )}Enum`
        : ''
    }})
@Expose()
public readonly ${attributeName}: ${generateTypescriptType(
      attribute,
      attributeName,
      input.displayName,
    )};
`;
    attributeTxt += property;
  });
  const template = `
import { ApiProperty } from '@nestjs/swagger';
import { Nullable } from '@moonlightjs/common';
import { Expose, Type } from 'class-transformer';

${enumTxt}

@Expose()
export class ${pascalCase(input.displayName)}Dto {
  @ApiProperty({ type: 'string', required: true })
  @Expose()
  public readonly id: string;
  ${attributeTxt}
  @ApiProperty({ type: 'string', required: true })
  @Expose()
  public readonly createdAt: string;
  @ApiProperty({ type: 'string', required: true, nullable: true })
  @Expose()
  public readonly createdById: Nullable<string>;
  @ApiProperty({ type: 'string', required: true, nullable: true })
  @Expose()
  public readonly createdBy: Nullable<string>;
  @ApiProperty({ type: 'string', required: true })
  @Expose()
  public readonly updatedAt: string;
  @ApiProperty({ type: 'string', required: true, nullable: true })
  @Expose()
  public readonly updatedById: Nullable<string>;
  @ApiProperty({ type: 'string', required: true, nullable: true })
  @Expose()
  public readonly updatedBy: Nullable<string>;
  @ApiProperty({ type: 'string', required: true })
  @Expose()
  public readonly deletedAt: string;
  @ApiProperty({ type: 'string', required: true, nullable: true })
  @Expose()
  public readonly deletedById: Nullable<string>;
  @ApiProperty({ type: 'string', required: true, nullable: true })
  @Expose()
  public readonly deletedBy: Nullable<string>;
}
`;
  return template;
};

const generateContentTypeCreateInputContent = (
  input: CreateContentTypeBuilderInput,
) => {
  let attributeTxt = '';
  let enumTxt = '';
  Object.keys(input.attributes).forEach((attributeName, index) => {
    const attribute = input.attributes[attributeName];

    if (attribute.type === 'enumeration') {
      enumTxt += `${pascalCase(input.displayName)}${pascalCase(
        attributeName,
      )}Enum,`;
    }

    if (index !== 0) attributeTxt += '\n';
    const property = `
@ApiProperty({ type: '${generateOpenApiType(attribute)}',${
      attribute.required ? 'required: true, ' : 'required: false, '
    }${attribute.required ? 'nullable: true, ' : 'nullable: false, '}${
      attribute.type === 'enumeration'
        ? ` enum: ${pascalCase(input.displayName)}${pascalCase(
            attributeName,
          )}Enum`
        : ''
    }})
${generateValidateType(attribute, attributeName, input.displayName)}
${attribute.required ? '@IsOptional()' : ''}
@Expose()
public readonly ${attributeName}: ${generateTypescriptType(
      attribute,
      attributeName,
      input.displayName,
    )};
`;
    attributeTxt += property;
  });
  const template = `
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
  MinLength
} from 'class-validator';${
    enumTxt.length
      ? `\nimport { ${enumTxt} } from './${paramCase(input.displayName)}.dto';`
      : ''
  }

@Expose()
export class Create${pascalCase(input.displayName)}Input {
  ${attributeTxt}
}`;
  return template;
};

const generateContentTypeUpdateInputContent = (
  input: CreateContentTypeBuilderInput,
) => {
  const template = `
import { PartialType } from '@nestjs/swagger';
import { Create${pascalCase(
    input.displayName,
  )}Input } from './create-${paramCase(input.displayName)}.input';

export class Update${pascalCase(
    input.displayName,
  )}Input extends PartialType(Create${pascalCase(input.displayName)}Input) {}
`;
  return template;
};

const generateTypescriptType = (
  attribute: CollationTypeAttribute,
  attributeName: string,
  modelName: string,
) => {
  let type = '';
  switch (attribute.type) {
    case 'string':
    case 'password':
    case 'text':
    case 'richtext':
      type = 'string';
      break;
    case 'integer':
    case 'bigint':
    case 'float':
    case 'decimal':
      type = 'number';
      break;
    case 'boolean':
      type = 'boolean';
      break;
    case 'json':
      type = 'any';
      break;
    case 'date':
    case 'datetime':
    case 'time':
      type = 'string';
      break;
    case 'enumeration':
      type = `${pascalCase(modelName)}${pascalCase(attributeName)}Enum`;
      break;
    default:
      throw new BadRequestException(
        `Current attribute type ${attribute.type} is not supported`,
      );
  }
  return attribute.required ? type : `Nullable<${type}>`;
};

const generateOpenApiType = (attribute: CollationTypeAttribute) => {
  switch (attribute.type) {
    case 'string':
    case 'password':
    case 'text':
    case 'richtext':
      return 'string';
    case 'integer':
    case 'bigint':
    case 'float':
    case 'decimal':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'json':
      return 'object';
    case 'date':
    case 'datetime':
    case 'time':
      return 'string';
    case 'enumeration':
      return 'string';
    default:
      throw new BadRequestException(
        `Current attribute type ${attribute.type} is not supported`,
      );
  }
};

const generateValidateType = (
  attribute: CollationTypeAttribute,
  attributeName: string,
  modelName: string,
) => {
  switch (attribute.type) {
    case 'string': {
      const attrStr = attribute as CollationTypeAttributeString;
      return `${
        attrStr.regex ? `@Matches(${new RegExp(attrStr.regex)})\n` : ''
      }${attrStr.required ? '@IsNotEmpty()\n' : ''}@MaxLength(${
        attrStr.maxLength ?? 255
      })${attrStr.minLength ? `\n@MinLength(${attrStr.minLength})` : ''}
@IsString()`;
    }
    case 'password': {
      return `@MaxLength(255)
@IsString()`;
    }
    case 'text':
    case 'richtext': {
      const attrStr = attribute as CollationTypeAttributeString;
      return `${
        attrStr.regex ? `@Matches(${new RegExp(attrStr.regex)})\n` : ''
      }${attrStr.required ? '@IsNotEmpty()\n' : ''}${
        attrStr.maxLength ? `@MaxLength(${attrStr.maxLength})\n` : ''
      }${attrStr.minLength ? `\n@MinLength(${attrStr.minLength})` : ''}
@IsString()`;
    }
    case 'integer':
    case 'bigint': {
      const attrNumber = attribute as CollationTypeAttributeNumber;
      return `${attrNumber.max ? `@Max(${attrNumber.max})\n` : ''}${
        attrNumber.min ? `@Min(${attrNumber.min})\n` : ''
      }@IsInt()`;
    }
    case 'float': {
      const attrNumber = attribute as CollationTypeAttributeNumber;
      return `${attrNumber.max ? `@Max(${attrNumber.max})\n` : ''}${
        attrNumber.min ? `@Min(${attrNumber.min})\n` : ''
      }@IsNumber()`;
    }
    case 'decimal': {
      const attrDecimal = attribute as CollationTypeAttributeDecimal;
      return `${attrDecimal.max ? `@Max(${attrDecimal.max})\n` : ''}${
        attrDecimal.min ? `@Min(${attrDecimal.min})\n` : ''
      }@IsNumber({ maxDecimalPlaces: ${attrDecimal.scale}})`;
    }
    case 'boolean':
      return '@IsBoolean()';
    case 'json':
      return '@IsJSON()';
    case 'date':
    case 'datetime':
    case 'time':
      return '@IsDateStringISO()';
    case 'enumeration':
      return `@IsEnum(${pascalCase(modelName)}${pascalCase(
        attributeName,
      )}Enum)`;
    default:
      throw new BadRequestException(
        `Current attribute type ${attribute.type} is not supported`,
      );
  }
};

const generateContentTypeDtoIndexContent = (
  input: CreateContentTypeBuilderInput,
) => {
  const template = `export * from './create-${paramCase(
    input.displayName,
  )}.input';
export * from './update-${paramCase(input.displayName)}.input';
export * from './${paramCase(input.displayName)}.dto';`;
  return template;
};
const generateContentTypeModuleIndexContent = (
  input: CreateContentTypeBuilderInput,
) => {
  const template = `export * from './dto';
export * from './${paramCase(input.displayName)}.controller';
export * from './${paramCase(input.displayName)}.service';`;
  return template;
};
