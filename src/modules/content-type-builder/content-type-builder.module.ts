import { Module } from '@nestjs/common';
import { ContentTypeBuilderService } from './content-type-builder.service';
import { ContentTypeBuilderController } from './content-type-builder.controller';
import { PrismaService } from '@src/infra/prisma/prisma.service';

@Module({
  controllers: [ContentTypeBuilderController],
  providers: [ContentTypeBuilderService, PrismaService],
  exports: [ContentTypeBuilderService],
})
export class ContentTypeBuilderModule {}
