import { PartialType } from '@nestjs/swagger';
import { CreateTestInput } from './create-test.input';

export class UpdateTestInput extends PartialType(CreateTestInput) {}
