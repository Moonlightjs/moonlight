
import { PartialType } from '@nestjs/swagger';
import { CreateDemoInput } from './create-demo.input';

export class UpdateDemoInput extends PartialType(CreateDemoInput) {}
