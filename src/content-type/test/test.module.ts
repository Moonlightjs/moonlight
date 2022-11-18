import { Module } from '@nestjs/common';
import { PrismaService } from '@src/infra/prisma/prisma.service';
import { TestService } from './test.service';
import { TestController } from './test.controller';

@Module({
  controllers: [TestController],
  providers: [TestService, PrismaService],
  exports: [TestService],
})
export class TestModule {}
