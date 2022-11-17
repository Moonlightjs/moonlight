import {
  CollationType,
  CollationTypeAttribute,
  CollationTypeAttributeBoolean,
  CollationTypeAttributeRelation,
  CollationTypeAttributeRelationBase,
  CollationTypeAttributeRelationInverse,
  CollationTypeAttributeRelationMapped,
  CollationTypeAttributeString,
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
import { PrismaService } from '@src/infra/prisma/prisma.service';
import * as path from 'path';
@Injectable()
export class ContentTypeBuilderService {
  constructor(protected prisma: PrismaService) {}
  async create(input: CreateContentTypeBuilderInput) {
    let data = await this.prisma.contentType.findFirst();
    let contentTypesSchema: Record<string, CollationType>;
    if (data && data.contentTypesSchema) {
      contentTypesSchema = data.contentTypesSchema as unknown as Record<
        string,
        CollationType
      >;
    } else {
      contentTypesSchema = {};
    }
    const uid = `api::${camelCase(input.collectionName)}`;
    const contentType: CollationType = {
      attributes: input.attributes,
      collectionName: input.collectionName,
      info: {
        description: input.description,
        displayName: input.displayName,
        pluralName: input.pluralName,
        singularName: input.singularName,
      },
      options: {
        draftAndPublish: input.draftAndPublish,
      },
      uid,
    };
    Object.keys(input.attributes).forEach((attributeName) => {
      const attribute = input.attributes[attributeName];
      if (attribute.type === 'relation') {
        const attrRelation = attribute as CollationTypeAttributeRelationInverse;
        attrRelation.inversedBy = attributeName;
        const target = contentTypesSchema[attrRelation.target];
        switch (attrRelation.relation) {
          case 'hasOne':
            break;
          case 'manyToOne':
            const oneToManyRelation: CollationTypeAttributeRelationMapped = {
              configurable: attrRelation.configurable,
              private: attrRelation.private,
              relation: 'oneToMany',
              required: attrRelation.required,
              target: uid,
              targetAttribute: attributeName,
              type: 'relation',
              unique: attrRelation.unique,
              visible: attrRelation.visible,
              writable: attrRelation.writable,
              mappedBy: attributeName,
            };
            target.attributes[attrRelation.targetAttribute] = oneToManyRelation;
            break;
          case 'oneToMany':
            const manyToOneRelation: CollationTypeAttributeRelationMapped = {
              configurable: attrRelation.configurable,
              private: attrRelation.private,
              relation: 'manyToOne',
              required: attrRelation.required,
              target: uid,
              targetAttribute: attributeName,
              type: 'relation',
              unique: attrRelation.unique,
              visible: attrRelation.visible,
              writable: attrRelation.writable,
              mappedBy: attributeName,
            };
            target.attributes[attrRelation.targetAttribute] = manyToOneRelation;
            break;
          case 'manyToMany':
            const manyToManyRelation: CollationTypeAttributeRelationMapped = {
              configurable: attrRelation.configurable,
              private: attrRelation.private,
              relation: 'manyToMany',
              required: attrRelation.required,
              target: uid,
              targetAttribute: attributeName,
              type: 'relation',
              unique: attrRelation.unique,
              visible: attrRelation.visible,
              writable: attrRelation.writable,
              mappedBy: attributeName,
            };
            target.attributes[attrRelation.targetAttribute] =
              manyToManyRelation;
            break;
        }
      }
    });
    contentTypesSchema[uid] = contentType;
    if (data) {
      await this.prisma.contentType.update({
        where: {
          id: data.id,
        },
        data: {
          contentTypesSchema: contentTypesSchema as any,
        },
      });
    } else {
      data = await this.prisma.contentType.create({
        data: {
          contentTypesSchema: contentTypesSchema as any,
        },
      });
    }

    Object.keys(contentTypesSchema).forEach((contentTypeId) => {
      generateContentTypeSchema(
        contentTypesSchema[contentTypeId],
        contentTypesSchema,
      );
      generateContentTypeModule(contentTypesSchema[contentTypeId]);
    });

    const rootFolder = process.env.ROOT_FOLDER as string;
    exec(`cd ${rootFolder} && npm run aurora`, (error, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);
      if (error !== null) {
        console.log(`exec error: ${error}`);
      }
    });
    exec(
      `cd ${rootFolder} && npx prisma migrate dev --name="create-${paramCase(
        contentType.collectionName,
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
        contentType.collectionName,
      )}-model"`,
      [],
      { stdio: 'inherit', shell: true },
    );

    shell.on('error', (error) => {
      console.log(`error: ${error.message}`);
    });

    shell.on('close', (code) => {
      console.log('[shell] terminated :', code);
      const appModulePath = path.join(rootFolder, 'src/app.module.ts');
      let appModuleContent = fs.readFileSync(appModulePath, {
        encoding: 'utf8',
      });
      const importStr = `import { ${pascalCase(
        contentType.collectionName,
      )}Module } from '@content-type/${paramCase(
        contentType.collectionName,
      )}/${paramCase(contentType.collectionName)}.module';`;
      const moduleName = `${pascalCase(contentType.collectionName)}Module`;
      if (!appModuleContent.includes(moduleName)) {
        const regex = /@Module\({\n  imports: \[([a-zA-Z0-9,\s.()]*)\]/gm;
        const m = regex.exec(appModuleContent);
        if (m && m.length > 1) {
          const text = m[1];
          appModuleContent =
            appModuleContent.slice(
              0,
              appModuleContent.indexOf(text) + text.length,
            ) +
            '    ' +
            moduleName +
            ',\n' +
            appModuleContent.slice(
              appModuleContent.indexOf(text) + text.length,
            );
        }
      }
      if (!appModuleContent.includes(importStr)) {
        const regex = /import [a-zA-Z0-9, .(){}''""@\/\-_]*;/gm;
        let m;
        let t;

        while ((m = regex.exec(appModuleContent)) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          t = m;
          if (m.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
        if (t) {
          appModuleContent =
            appModuleContent.slice(
              0,
              appModuleContent.indexOf(t[0]) + t[0].length,
            ) +
            '\n' +
            importStr +
            appModuleContent.slice(
              appModuleContent.indexOf(t[0]) + t[0].length,
            );
        }
      }
      console.log(appModuleContent);
      fs.writeFileSync(`${appModulePath}`, appModuleContent, {
        encoding: 'utf-8',
      });

      exec(`cd ${rootFolder} && npm run format`, (error, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (error !== null) {
          console.log(`exec error: ${error}`);
        }
      });
    });

    return data;
  }
}

const generateContentTypeSchema = (
  contentType: CollationType,
  contentTypesSchema: Record<string, CollationType>,
) => {
  const rootFolder = process.env.ROOT_FOLDER;
  console.log(rootFolder);
  try {
    // remove schema file if it exists
    fs.removeSync(
      `${rootFolder}/prisma/schemas/${paramCase(
        contentType.collectionName,
      )}.prisma`,
    );
  } catch (err) {
    console.warn(err);
  }

  fs.mkdirSync(`${rootFolder}/prisma/schemas`, {
    recursive: true,
  });
  fs.writeFileSync(
    `${rootFolder}/prisma/schemas/${paramCase(
      contentType.collectionName,
    )}.prisma`,
    generateContentTypeSchemaContent(contentType, contentTypesSchema, true),
    {
      encoding: 'utf-8',
    },
  );
};

const generateContentTypeSchemaContent = (
  contentType: CollationType,
  contentTypesSchema: Record<string, CollationType>,
  isFirst: boolean,
) => {
  let schemaAttribute = '';
  let enumTxt = '';
  let relations = '';
  Object.keys(contentType.attributes).forEach((attributeName, index) => {
    const attribute = contentType.attributes[attributeName];

    if (attribute.type === 'enumeration') {
      const attributeEnum = attribute as CollationTypeAttributeEnumeration;
      enumTxt += `\n
enum ${pascalCase(contentType.collectionName)}${pascalCase(attributeName)} {
  ${attributeEnum.enum.join('\n  ')}
}`;
    }
    if (index !== 0) schemaAttribute += '\n';
    let property = '';
    if (attribute.type === 'relation') {
      property = generateSchemeAttributeRelationType(
        attribute,
        contentType.collectionName,
        contentTypesSchema,
      );
      if (isFirst) {
        relations +=
          generateContentTypeSchemaContent(
            contentTypesSchema[attribute.target],
            contentTypesSchema,
            false,
          ) + '\n';
      }
    } else {
      property = `  ${attributeName} `;
      property +=
        ' ' +
        generateSchemeAttributeType(
          attribute,
          attributeName,
          contentType.collectionName,
        );
      property += '' + generateSchemeAttributeRequired(attribute.required);
      property += ' ' + generateSchemeAttributeNativeType(attribute);
    }
    schemaAttribute += property;
  });
  const schemaTemplate = `
${
  isFirst
    ? `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native"]
}`
    : ''
}
${enumTxt}

model ${pascalCase(contentType.collectionName)} {
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
}

${relations}
`;
  return schemaTemplate;
};

const generateSchemeAttributeRelationType = (
  attribute: CollationTypeAttribute,
  modelName: string,
  contentTypesSchema: Record<string, CollationType>,
) => {
  const attrRelation = attribute as CollationTypeAttributeRelationBase;
  const target = contentTypesSchema[attrRelation.target];
  if (!target) {
    throw new BadRequestException(`target: ${target} not found in schema`);
  }
  switch (attrRelation.relation) {
    case 'hasOne':
      return `${camelCase(target.collectionName)}Id String${
        attrRelation.required ? '' : '?'
      }  @unique @db.Uuid()
${camelCase(target.collectionName)}   ${pascalCase(
        target.collectionName,
      )} @relation(fields: [${camelCase(
        target.collectionName,
      )}Id], references: [id])`;
    case 'manyToOne':
      return `${camelCase(target.collectionName)}s ${pascalCase(
        target.collectionName,
      )}[]`;
    case 'oneToMany':
      return `${camelCase(target.collectionName)}Id        String${
        attrRelation.required ? '' : '?'
      }   @db.Uuid()
${camelCase(target.collectionName)} ${pascalCase(
        target.collectionName,
      )}? @relation(fields: [${camelCase(
        target.collectionName,
      )}Id], references: [id])`;
    case 'manyToMany':
      let relationName = '';
      if (modelName > target.collectionName) {
        relationName = `${pascalCase(modelName)}${pascalCase(
          target.collectionName,
        )}Relation`;
      } else {
        relationName = `${pascalCase(target.collectionName)}${pascalCase(
          modelName,
        )}Relation`;
      }
      return `${camelCase(target.collectionName)}s pascalCase(
        target.collectionName,
      )}[] @relation("${relationName}")`;
  }
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
    case 'relation':
      return '';
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
    case 'relation':
      return '';
    default:
      throw new BadRequestException('Current attribute type is not supported');
  }
};

const generateContentTypeModule = (contentType: CollationType) => {
  const rootFolder = process.env.ROOT_FOLDER;
  try {
    // remove content-type folder if it exists
    fs.removeSync(
      `${rootFolder}/src/content-type/${paramCase(contentType.collectionName)}`,
    );
  } catch (err) {
    console.warn(err);
  }

  fs.mkdirSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/dto`,
    {
      recursive: true,
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/${paramCase(contentType.collectionName)}.module.ts`,
    generateContentTypeModuleContent(contentType),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/${paramCase(contentType.collectionName)}.controller.ts`,
    generateContentTypeControllerContent(contentType),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/${paramCase(contentType.collectionName)}.service.ts`,
    generateContentTypeServiceContent(contentType),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/dto/${paramCase(contentType.collectionName)}.dto.ts`,
    generateContentTypeDtoContent(contentType),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/dto/create-${paramCase(contentType.collectionName)}.input.ts`,
    generateContentTypeCreateInputContent(contentType),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/dto/update-${paramCase(contentType.collectionName)}.input.ts`,
    generateContentTypeUpdateInputContent(contentType),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/dto/index.ts`,
    generateContentTypeDtoIndexContent(contentType),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/index.ts`,
    generateContentTypeModuleIndexContent(contentType),
    {
      encoding: 'utf-8',
    },
  );
};

const generateContentTypeModuleContent = (contentType: CollationType) => {
  const template = `import { Module } from '@nestjs/common';
import { PrismaService } from '@src/infra/prisma/prisma.service';
import { ${pascalCase(contentType.collectionName)}Service } from './${paramCase(
    contentType.collectionName,
  )}.service';
import { ${pascalCase(
    contentType.collectionName,
  )}Controller } from './${paramCase(contentType.collectionName)}.controller';

@Module({
  controllers: [${pascalCase(contentType.collectionName)}Controller],
  providers: [${pascalCase(contentType.collectionName)}Service, PrismaService],
  exports: [${pascalCase(contentType.collectionName)}Service],
})
export class ${pascalCase(contentType.collectionName)}Module {}
`;
  return template;
};

const generateContentTypeControllerContent = (contentType: CollationType) => {
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
import { ${pascalCase(contentType.collectionName)}Dto } from './dto/${paramCase(
    contentType.collectionName,
  )}.dto';
import { ${pascalCase(contentType.collectionName)}Service } from './${paramCase(
    contentType.collectionName,
  )}.service';
import { Update${pascalCase(
    contentType.collectionName,
  )}Input } from './dto/update-${paramCase(contentType.collectionName)}.input';
import { Create${pascalCase(
    contentType.collectionName,
  )}Input } from './dto/create-${paramCase(contentType.collectionName)}.input';

@ApiTags('${contentType.collectionName}')
@Controller({
  path: '${paramCase(contentType.collectionName)}',
  version: '1',
})
// @UseGuards(JwtAuthGuard)
export class ${pascalCase(contentType.collectionName)}Controller {
  constructor(protected readonly ${camelCase(
    contentType.collectionName,
  )}Service: ${pascalCase(contentType.collectionName)}Service) {}

  @ApiBody({
    type: Create${pascalCase(contentType.collectionName)}Input,
  })
  @OpenApiResponse({
    status: HttpStatus.CREATED,
    model: ${pascalCase(contentType.collectionName)}Dto,
  })
  @Post()
  create(
    @Body() create${pascalCase(
      contentType.collectionName,
    )}Input: Create${pascalCase(contentType.collectionName)}Input,
    @Query() params: Omit<Prisma.${pascalCase(
      contentType.collectionName,
    )}CreateArgs, 'data'>,
  ) {
    return this.${camelCase(contentType.collectionName)}Service.create({
      ...params,
      data: {
        ...create${pascalCase(contentType.collectionName)}Input
      },
    });
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiResponse({
    status: HttpStatus.OK,
    model: ${pascalCase(contentType.collectionName)}Dto,
    isArray: true,
  })
  @Get()
  findAll(@Query() params: Prisma.${pascalCase(
    contentType.collectionName,
  )}FindManyArgs) {
    return this.${camelCase(contentType.collectionName)}Service.findAll(params);
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiPaginationResponse(${pascalCase(contentType.collectionName)}Dto)
  @Get('/pagination')
  findAllPagination(@Query() params: Prisma.${pascalCase(
    contentType.collectionName,
  )}FindManyArgs) {
    return this.${camelCase(
      contentType.collectionName,
    )}Service.findAllPagination(params);
  }

  @ApiQuery({
    type: FindOneArgs,
  })
  @OpenApiResponse({ status: HttpStatus.OK, model: ${pascalCase(
    contentType.collectionName,
  )}Dto })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query() params: Prisma.${pascalCase(
      contentType.collectionName,
    )}FindUniqueArgs,
  ) {
    params.where = {
      id,
    };
    return this.${camelCase(contentType.collectionName)}Service.findOne(params);
  }

  @OpenApiResponse({ status: HttpStatus.OK, model: ${pascalCase(
    contentType.collectionName,
  )}Dto })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() update${pascalCase(
      contentType.collectionName,
    )}Input: Update${pascalCase(contentType.collectionName)}Input,
    @Query() params: Omit<Prisma.${pascalCase(
      contentType.collectionName,
    )}UpdateArgs, 'data' | 'where'>,
  ) {
    return this.${camelCase(contentType.collectionName)}Service.update({
      ...params,
      where: {
        id,
      },
      data: {
        ...update${pascalCase(contentType.collectionName)}Input,
      },
    });
  }

  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDto })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${camelCase(contentType.collectionName)}Service.remove({
      id,
    });
  }
}
`;
  return template;
};

const generateContentTypeServiceContent = (contentType: CollationType) => {
  const template = `
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PagedResultDto,
  Pagination,
  toDto,
  HttpErrorException,
} from '@moonlightjs/common';
import { PrismaService } from '@src/infra/prisma/prisma.service';
import { ${pascalCase(contentType.collectionName)}Dto } from './dto/${paramCase(
    contentType.collectionName,
  )}.dto';
import { Update${pascalCase(
    contentType.collectionName,
  )}Input } from './dto/update-${paramCase(contentType.collectionName)}.input';
import { Create${pascalCase(
    contentType.collectionName,
  )}Input } from './dto/create-${paramCase(contentType.collectionName)}.input';

const DEFAULT_SKIP = 0;
const DEFAULT_TAKE = 20;

@Injectable()
export class ${pascalCase(contentType.collectionName)}Service {
  constructor(
    protected prisma: PrismaService
  ) {}

  async findOne(params: Prisma.${pascalCase(
    contentType.collectionName,
  )}FindFirstArgs) : Promise<${pascalCase(contentType.collectionName)}Dto> {
    const ${camelCase(
      contentType.collectionName,
    )} = await this.prisma.${camelCase(
    contentType.collectionName,
  )}.findFirst(params);
    return toDto<${pascalCase(contentType.collectionName)}Dto>(${pascalCase(
    contentType.collectionName,
  )}Dto, ${camelCase(contentType.collectionName)});
  }

  async findAll(params: Prisma.${pascalCase(
    contentType.collectionName,
  )}FindManyArgs): Promise<${pascalCase(contentType.collectionName)}Dto[]> {
    params.skip = params.skip ?? DEFAULT_SKIP;
    params.take = params.take ?? DEFAULT_TAKE;
    const ${camelCase(
      contentType.collectionName,
    )}s = await this.prisma.${camelCase(
    contentType.collectionName,
  )}.findMany(params);
    return ${camelCase(contentType.collectionName)}s.map((${camelCase(
    contentType.collectionName,
  )}) => toDto<${pascalCase(contentType.collectionName)}Dto>(${pascalCase(
    contentType.collectionName,
  )}Dto, ${camelCase(contentType.collectionName)}));
  }

  async findAllPagination(
    params: Prisma.${pascalCase(contentType.collectionName)}FindManyArgs,
  ): Promise<PagedResultDto<${pascalCase(contentType.collectionName)}Dto>> {
    params.skip = params.skip ?? DEFAULT_SKIP;
    params.take = params.take ?? DEFAULT_TAKE;
    const [${camelCase(
      contentType.collectionName,
    )}s, total] = await Promise.all([
      this.prisma.${camelCase(contentType.collectionName)}.findMany(params),
      this.prisma.${camelCase(contentType.collectionName)}.count({
        where: params.where,
      }),
    ]);
    return PagedResultDto.create({
      data: ${camelCase(contentType.collectionName)}s.map((${camelCase(
    contentType.collectionName,
  )}) => toDto<${pascalCase(contentType.collectionName)}Dto>(${pascalCase(
    contentType.collectionName,
  )}Dto, ${camelCase(contentType.collectionName)})),
      pagination: Pagination.create({
        take: params.take,
        skip: params.skip,
        total: total,
      }),
    });
  }

  async create(params: Prisma.${pascalCase(
    contentType.collectionName,
  )}CreateArgs): Promise<${pascalCase(contentType.collectionName)}Dto> {
    const ${camelCase(
      contentType.collectionName,
    )} = await this.prisma.${camelCase(
    contentType.collectionName,
  )}.create(params);
    return toDto<${pascalCase(contentType.collectionName)}Dto>(${pascalCase(
    contentType.collectionName,
  )}Dto, ${camelCase(contentType.collectionName)});
  }

  async update(params: Prisma.${pascalCase(
    contentType.collectionName,
  )}UpdateArgs): Promise<${pascalCase(contentType.collectionName)}Dto> {
    const ${camelCase(
      contentType.collectionName,
    )} = await this.prisma.${camelCase(
    contentType.collectionName,
  )}.update(params);
    return toDto<${pascalCase(contentType.collectionName)}Dto>(${pascalCase(
    contentType.collectionName,
  )}Dto, ${camelCase(contentType.collectionName)});
  }

  async remove(where: Prisma.${pascalCase(
    contentType.collectionName,
  )}WhereUniqueInput): Promise<boolean> {
    const ${camelCase(
      contentType.collectionName,
    )} = await this.prisma.${camelCase(contentType.collectionName)}.delete({
      where,
    });
    return !!${camelCase(contentType.collectionName)};
  }
}`;
  return template;
};

const generateContentTypeDtoContent = (contentType: CollationType) => {
  let attributeTxt = '';
  let enumTxt = '';
  Object.keys(contentType.attributes).forEach((attributeName, index) => {
    const attribute = contentType.attributes[attributeName];

    if (attribute.type === 'enumeration') {
      const attributeEnum = attribute as CollationTypeAttributeEnumeration;
      enumTxt += `
export enum ${pascalCase(contentType.collectionName)}${pascalCase(
        attributeName,
      )}Enum {
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
        ? ` enum: ${pascalCase(contentType.collectionName)}${pascalCase(
            attributeName,
          )}Enum`
        : ''
    }})
@Expose()
public readonly ${attributeName}: ${generateTypescriptType(
      attribute,
      attributeName,
      contentType.collectionName,
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
export class ${pascalCase(contentType.collectionName)}Dto {
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

const generateContentTypeCreateInputContent = (contentType: CollationType) => {
  let attributeTxt = '';
  let enumTxt = '';
  Object.keys(contentType.attributes).forEach((attributeName, index) => {
    const attribute = contentType.attributes[attributeName];

    if (attribute.type === 'enumeration') {
      enumTxt += `${pascalCase(contentType.collectionName)}${pascalCase(
        attributeName,
      )}Enum,`;
    }

    if (index !== 0) attributeTxt += '\n';
    const property = `
@ApiProperty({ type: '${generateOpenApiType(attribute)}',${
      attribute.required ? 'required: true, ' : 'required: false, '
    }${attribute.required ? 'nullable: true, ' : 'nullable: false, '}${
      attribute.type === 'enumeration'
        ? ` enum: ${pascalCase(contentType.collectionName)}${pascalCase(
            attributeName,
          )}Enum`
        : ''
    }})
${generateValidateType(attribute, attributeName, contentType.collectionName)}
${attribute.required ? '' : '@IsOptional()'}
@Expose()
public readonly ${attributeName}: ${generateTypescriptType(
      attribute,
      attributeName,
      contentType.collectionName,
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
      ? `\nimport { ${enumTxt} } from './${paramCase(
          contentType.collectionName,
        )}.dto';`
      : ''
  }

@Expose()
export class Create${pascalCase(contentType.collectionName)}Input {
  ${attributeTxt}
}`;
  return template;
};

const generateContentTypeUpdateInputContent = (contentType: CollationType) => {
  const template = `
import { PartialType } from '@nestjs/swagger';
import { Create${pascalCase(
    contentType.collectionName,
  )}Input } from './create-${paramCase(contentType.collectionName)}.input';

export class Update${pascalCase(
    contentType.collectionName,
  )}Input extends PartialType(Create${pascalCase(
    contentType.collectionName,
  )}Input) {}
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
    case 'relation':
      return '';
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

const generateContentTypeDtoIndexContent = (contentType: CollationType) => {
  const template = `export * from './create-${paramCase(
    contentType.collectionName,
  )}.input';
export * from './update-${paramCase(contentType.collectionName)}.input';
export * from './${paramCase(contentType.collectionName)}.dto';`;
  return template;
};
const generateContentTypeModuleIndexContent = (contentType: CollationType) => {
  const template = `export * from './dto';
export * from './${paramCase(contentType.collectionName)}.controller';
export * from './${paramCase(contentType.collectionName)}.service';`;
  return template;
};
