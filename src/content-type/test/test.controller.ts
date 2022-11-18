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
import { TestDto } from './dto/test.dto';
import { TestService } from './test.service';
import { UpdateTestInput } from './dto/update-test.input';
import { CreateTestInput } from './dto/create-test.input';

@ApiTags('test')
@Controller({
  path: 'test',
  version: '1',
})
// @UseGuards(JwtAuthGuard)
export class TestController {
  constructor(protected readonly testService: TestService) {}

  @ApiBody({
    type: CreateTestInput,
  })
  @OpenApiResponse({
    status: HttpStatus.CREATED,
    model: TestDto,
  })
  @Post()
  create(
    @Body() createTestInput: CreateTestInput,
    @Query() params: Omit<Prisma.TestCreateArgs, 'data'>,
  ) {
    return this.testService.create({
      ...params,
      data: {
        ...createTestInput,
      },
    });
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiResponse({
    status: HttpStatus.OK,
    model: TestDto,
    isArray: true,
  })
  @Get()
  findAll(@Query() params: Prisma.TestFindManyArgs) {
    return this.testService.findAll(params);
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiPaginationResponse(TestDto)
  @Get('/pagination')
  findAllPagination(@Query() params: Prisma.TestFindManyArgs) {
    return this.testService.findAllPagination(params);
  }

  @ApiQuery({
    type: FindOneArgs,
  })
  @OpenApiResponse({ status: HttpStatus.OK, model: TestDto })
  @Get(':id')
  findOne(@Param('id') id: string, @Query() params: Prisma.TestFindUniqueArgs) {
    params.where = {
      id,
    };
    return this.testService.findOne(params);
  }

  @OpenApiResponse({ status: HttpStatus.OK, model: TestDto })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTestInput: UpdateTestInput,
    @Query() params: Omit<Prisma.TestUpdateArgs, 'data' | 'where'>,
  ) {
    return this.testService.update({
      ...params,
      where: {
        id,
      },
      data: {
        ...updateTestInput,
      },
    });
  }

  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDto })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testService.remove({
      id,
    });
  }
}
