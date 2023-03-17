import { Module } from '@nestjs/common';
import { DemoService } from './demo.service';
import { AdminDemoController } from './admin-demo.controller';
import { DemoController } from './demo.controller';

@Module({
  controllers: [AdminDemoController, DemoController],
  providers: [DemoService],
  exports: [DemoService],
})
export class DemoModule {}
