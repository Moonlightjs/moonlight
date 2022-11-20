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
import { DemoService } from './demo.service';
import { UpdateAdminDemoInput } from './dto/update-admin-demo.input';
import { CreateAdminDemoInput } from './dto/create-admin-demo.input';
import { AdminDemoDto } from './dto/admin-demo.dto';

@ApiTags('admin-demo')
@Controller({
  path: 'admin/demo',
  version: '1',
})
// @UseGuards(JwtAuthGuard)
export class AdminDemoController {
  constructor(protected readonly demoService: DemoService) {}

  @ApiBody({
    type: CreateAdminDemoInput,
  })
  @OpenApiResponse({
    status: HttpStatus.CREATED,
    model: AdminDemoDto,
  })
  @Post()
  create(
    @Body() createDemoInput: CreateAdminDemoInput,
    @Query() params: Omit<Prisma.DemoCreateArgs, 'data'>,
  ) {
    return this.demoService.create(
      {
        ...params,
        data: {
          ...createDemoInput,
        },
      },
      AdminDemoDto,
    );
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiResponse({
    status: HttpStatus.OK,
    model: AdminDemoDto,
    isArray: true,
  })
  @Get()
  findAll(@Query() params: Prisma.DemoFindManyArgs) {
    return this.demoService.findAll(params, AdminDemoDto);
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiPaginationResponse(AdminDemoDto)
  @Get('/pagination')
  findAllPagination(@Query() params: Prisma.DemoFindManyArgs) {
    return this.demoService.findAllPagination(params, AdminDemoDto);
  }

  @ApiQuery({
    type: FindOneArgs,
  })
  @OpenApiResponse({ status: HttpStatus.OK, model: AdminDemoDto })
  @Get(':id')
  findOne(@Param('id') id: string, @Query() params: Prisma.DemoFindUniqueArgs) {
    params.where = {
      id,
    };
    return this.demoService.findOne(params, AdminDemoDto);
  }

  @OpenApiResponse({ status: HttpStatus.OK, model: AdminDemoDto })
  @Patch(':id/published')
  published(@Param('id') id: string) {
    return this.demoService.update(
      {
        where: {
          id,
        },
        data: {
          publishedAt: new Date(),
        },
      },
      AdminDemoDto,
    );
  }

  @OpenApiResponse({ status: HttpStatus.OK, model: AdminDemoDto })
  @Patch(':id/un-published')
  unPublished(@Param('id') id: string) {
    return this.demoService.update(
      {
        where: {
          id,
        },
        data: {
          publishedAt: null,
        },
      },
      AdminDemoDto,
    );
  }
  @OpenApiResponse({ status: HttpStatus.OK, model: AdminDemoDto })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDemoInput: UpdateAdminDemoInput,
    @Query() params: Omit<Prisma.DemoUpdateArgs, 'data' | 'where'>,
  ) {
    return this.demoService.update(
      {
        ...params,
        where: {
          id,
        },
        data: {
          ...updateDemoInput,
        },
      },
      AdminDemoDto,
    );
  }

  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDto })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.demoService.remove({
      id,
    });
  }
}
