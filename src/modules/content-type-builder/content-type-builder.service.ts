import {
  CollationType,
  CollationTypeAttributeRelationInverse,
  CollationTypeAttributeRelationMapped,
} from '@modules/content-type-builder/collation-type';
import { CreateContentTypeBuilderInput } from '@modules/content-type-builder/dto/create-content-type-builder.input';
import { UpdateContentTypeBuilderInput } from '@modules/content-type-builder/dto/update-content-type-builder.input';
import { generateContentTypesModule } from '@modules/content-type-builder/generate-content-type-module';
import { generateContentTypeSchema } from '@modules/content-type-builder/generate-content-type-schema';
import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@src/infra/prisma/prisma.service';
import { camelCase, paramCase, pascalCase } from 'change-case';
import { exec, spawn, SpawnOptions } from 'child_process';
import { readdir, readFile } from 'fs/promises';
import * as util from 'util';
import { ContentType } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MigrateDev } = require('prisma');

const getDirectories = async (source: string) =>
  (await readdir(source, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const execPromise = util.promisify(exec);

const spawnPromise = (
  command: string,
  args: readonly string[],
  options: SpawnOptions,
) => {
  return new Promise((resolve, reject) => {
    const shell = spawn(command, args, options);
    shell.on('error', (error) => {
      console.log(`error: ${error.message}`);
      reject(error);
    });
    shell.on('close', (code) => {
      console.log(`[shell] ${command} terminated :`, code);
      resolve(null);
    });
  });
};
@Injectable()
export class ContentTypeBuilderService implements OnModuleInit {
  constructor(protected prisma: PrismaService) {}

  async onModuleInit() {
    const rootFolder = process.env.ROOT_FOLDER as string;
    let listPathFolderContentTypes: string[] = [];
    try {
      listPathFolderContentTypes = await getDirectories(
        `${rootFolder}/src/content-type`,
      );
    } catch (error) {
      listPathFolderContentTypes = [];
    }
    const data = await this.prisma.contentType.findFirst();
    let contentTypesSchema: Record<string, CollationType>;
    if (data && data.contentTypesSchema) {
      contentTypesSchema = data.contentTypesSchema as unknown as Record<
        string,
        CollationType
      >;
    } else {
      contentTypesSchema = {};
    }
    await Promise.all(
      listPathFolderContentTypes.map(async (contentTypePath) => {
        const schema = await readFile(
          `${rootFolder}/src/content-type/${contentTypePath}/content-types/schema.json`,
          'utf8',
        );
        const contentType: CollationType = JSON.parse(schema);
        contentTypesSchema[contentType.uid] = contentType;
      }),
    );
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
      await this.prisma.contentType.create({
        data: {
          contentTypesSchema: contentTypesSchema as any,
        },
      });
    }
    const migrateDev = MigrateDev.new();
    await migrateDev.parse(['--force']);
    // try {
    //   await spawnPromise(
    //     `cd ${rootFolder} && npm run prisma migrate dev --force`,
    //     [],
    //     {
    //       stdio: 'inherit',
    //       shell: true,
    //     },
    //   );
    // } catch (err) {
    //   console.error(err);
    // }
  }

  async update(uid: string, input: UpdateContentTypeBuilderInput) {
    const data = await this.prisma.contentType.findFirst();
    if (!(data && data.contentTypesSchema)) {
      throw new BadRequestException();
    }
    const contentTypesSchema: Record<string, CollationType> =
      data.contentTypesSchema as unknown as Record<string, CollationType>;
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
        softDelete: input.softDelete,
      },
      uid,
    };
    await this.process(uid, contentType, contentTypesSchema, data);
  }

  async create(input: CreateContentTypeBuilderInput) {
    let data = await this.prisma.contentType.findFirst();
    let contentTypesSchema: Record<string, CollationType>;
    if (data && data.contentTypesSchema) {
      contentTypesSchema = data.contentTypesSchema as unknown as Record<
        string,
        CollationType
      >;
    } else {
      const execPromise = util.promisify(exec);
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
        softDelete: input.softDelete,
      },
      uid,
    };

    data = await this.process(uid, contentType, contentTypesSchema, data);

    return data;
  }

  async process(
    uid: string,
    contentType: CollationType,
    contentTypesSchema: Record<string, CollationType>,
    data: ContentType | null,
  ) {
    let result = data;
    Object.keys(contentType.attributes).forEach((attributeName) => {
      const attribute = contentType.attributes[attributeName];
      if (attribute.type === 'relation') {
        const attrRelation = attribute as CollationTypeAttributeRelationInverse;
        attrRelation.inversedBy = attributeName;
        const target = contentTypesSchema[attrRelation.target];
        if (!target)
          throw new BadRequestException(
            `${attrRelation.target} does not exist`,
          );
        switch (attrRelation.relation) {
          case 'oneToOne':
            const oneToOneRelation: CollationTypeAttributeRelationMapped = {
              configurable: attrRelation.configurable,
              private: attrRelation.private,
              relation: 'oneToOne',
              required: attrRelation.required,
              target: uid,
              targetAttribute: attributeName,
              type: 'relation',
              unique: attrRelation.unique,
              visible: attrRelation.visible,
              writable: attrRelation.writable,
              mappedBy: attributeName,
            };
            target.attributes[attrRelation.targetAttribute] = oneToOneRelation;
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
    if (result) {
      result.contentTypesSchema = contentTypesSchema as any;
      await this.prisma.contentType.update({
        where: {
          id: result.id,
        },
        data: {
          contentTypesSchema: contentTypesSchema as any,
        },
      });
    } else {
      result = await this.prisma.contentType.create({
        data: {
          contentTypesSchema: contentTypesSchema as any,
        },
      });
    }

    generateContentTypeSchema(contentTypesSchema);
    generateContentTypesModule(contentTypesSchema);

    const rootFolder = process.env.ROOT_FOLDER as string;

    const execAurora = await execPromise(`cd ${rootFolder} && npm run aurora`);

    console.log('stdout:', execAurora.stdout);
    console.log('stderr:', execAurora.stderr);

    // await spawnPromise(
    //   `cd ${rootFolder} && npm run prisma migrate dev -n "create-${paramCase(
    //     contentType.collectionName,
    //   )}-model" --force`,
    //   [],
    //   {
    //     stdio: 'inherit',
    //     shell: true,
    //   },
    // );

    const migrateDev = MigrateDev.new();
    await migrateDev.parse([
      '-n',
      `create-${paramCase(contentType.collectionName)}-model`,
      '--force',
    ]);

    const execFormat = await execPromise(`cd ${rootFolder} && npm run format`);

    console.log('stdout:', execFormat.stdout);
    console.log('stderr:', execFormat.stderr);

    // await new Promise((resolve, reject) => {
    //   const shell = spawn(`cd ${rootFolder} && npm run aurora`, [], {
    //     stdio: 'inherit',
    //     shell: true,
    //   });

    //   shell.on('error', (error) => {
    //     console.log(`error: ${error.message}`);
    //     reject(error);
    //   });

    //   shell.on('close', (code) => {
    //     console.log('[shell] npm run aurora terminated :', code);
    //     resolve(null);
    //   });
    // });
    // await new Promise((resolve, reject) => {
    //   const shell = spawn(
    //     `echo 'y' | cd ${rootFolder} && npx prisma migrate dev --name="create-${paramCase(
    //       contentType.collectionName,
    //     )}-model"`,
    //     [],
    //     { stdio: 'inherit', shell: true },
    //   );
    //   shell.on('error', (error) => {
    //     console.log(`error: ${error.message}`);
    //     reject(error);
    //   });
    //   shell.on('close', (code) => {
    //     console.log(
    //       '[shell] npx prisma migrate dev --name= terminated :',
    //       code,
    //     );
    //     resolve(null);
    //   });
    // });
    // await new Promise((resolve, reject) => {
    //   const shell = spawn(`cd ${rootFolder} && npm run format`, [], {
    //     stdio: 'inherit',
    //     shell: true,
    //   });

    //   shell.on('error', (error) => {
    //     console.log(`error: ${error.message}`);
    //     reject(error);
    //   });

    //   shell.on('close', (code) => {
    //     console.log('[shell] terminated : npm run format', code);
    //     resolve(null);
    //   });
    // });
    return result;
  }
}
