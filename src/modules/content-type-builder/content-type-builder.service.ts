import {
  CollationType,
  CollationTypeAttributeRelationInverse,
  CollationTypeAttributeRelationMapped,
} from '@modules/content-type-builder/collation-type';
import { CreateContentTypeBuilderInput } from '@modules/content-type-builder/dto/create-content-type-builder.input';
import { generateContentTypesModule } from '@modules/content-type-builder/generate-content-type-module';
import { generateContentTypeSchema } from '@modules/content-type-builder/generate-content-type-schema';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/infra/prisma/prisma.service';
import { camelCase, paramCase, pascalCase } from 'change-case';
import { exec, spawn } from 'child_process';

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
    generateContentTypeSchema(contentTypesSchema);
    generateContentTypesModule(contentTypesSchema);

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
