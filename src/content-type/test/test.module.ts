import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { AdminTestController } from './admin-test.controller';
import { TestController } from './test.controller';

@Module({
  controllers: [AdminTestController, TestController],
  providers: [TestService],
  exports: [TestService],
})
export class TestModule {}
