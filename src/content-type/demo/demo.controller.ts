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
import { DemoDto } from './dto/demo.dto';
import { DemoService } from './demo.service';
import { UpdateDemoInput } from './dto/update-demo.input';
import { CreateDemoInput } from './dto/create-demo.input';

@ApiTags('demo')
@Controller({
  path: 'demo',
  version: '1',
})
// @UseGuards(JwtAuthGuard)
export class DemoController {
  constructor(protected readonly demoService: DemoService) {}

  @ApiBody({
    type: CreateDemoInput,
  })
  @OpenApiResponse({
    status: HttpStatus.CREATED,
    model: DemoDto,
  })
  @Post()
  create(
    @Body() createDemoInput: CreateDemoInput,
    @Query() params: Omit<Prisma.DemoCreateArgs, 'data'>,
  ) {
    return this.demoService.create({
      ...params,
      data: {
        ...createDemoInput,
      },
    });
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiResponse({
    status: HttpStatus.OK,
    model: DemoDto,
    isArray: true,
  })
  @Get()
  findAll(@Query() params: Prisma.DemoFindManyArgs) {
    return this.demoService.findAll(params);
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiPaginationResponse(DemoDto)
  @Get('/pagination')
  findAllPagination(@Query() params: Prisma.DemoFindManyArgs) {
    return this.demoService.findAllPagination(params);
  }

  @ApiQuery({
    type: FindOneArgs,
  })
  @OpenApiResponse({ status: HttpStatus.OK, model: DemoDto })
  @Get(':id')
  findOne(@Param('id') id: string, @Query() params: Prisma.DemoFindUniqueArgs) {
    params.where = {
      id,
    };
    return this.demoService.findOne(params);
  }

  @OpenApiResponse({ status: HttpStatus.OK, model: DemoDto })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDemoInput: UpdateDemoInput,
    @Query() params: Omit<Prisma.DemoUpdateArgs, 'data' | 'where'>,
  ) {
    return this.demoService.update({
      ...params,
      where: {
        id,
      },
      data: {
        ...updateDemoInput,
      },
    });
  }

  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDto })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.demoService.remove({
      id,
    });
  }
}
