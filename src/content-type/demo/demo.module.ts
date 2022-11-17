import { Module } from '@nestjs/common';
import { PrismaService } from '@src/infra/prisma/prisma.service';
import { DemoService } from './demo.service';
import { DemoController } from './demo.controller';

@Module({
  controllers: [DemoController],
  providers: [DemoService, PrismaService],
  exports: [DemoService],
})
export class DemoModule {}
