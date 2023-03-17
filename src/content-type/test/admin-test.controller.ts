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
import { TestService } from './test.service';
import { UpdateAdminTestInput } from './dto/update-admin-test.input';
import { CreateAdminTestInput } from './dto/create-admin-test.input';
import { AdminTestDto } from './dto/admin-test.dto';

@ApiTags('admin-content-type-test')
@Controller({
  path: 'admin/content-type/test',
  version: '1',
})
// @UseGuards(JwtAuthGuard)
export class AdminTestController {
  constructor(protected readonly testService: TestService) {}

  @ApiBody({
    type: CreateAdminTestInput,
  })
  @OpenApiResponse({
    status: HttpStatus.CREATED,
    model: AdminTestDto,
  })
  @Post()
  create(
    @Body() createTestInput: CreateAdminTestInput,
    @Query() params: Omit<Prisma.TestCreateArgs, 'data'>,
  ) {
    return this.testService.create(
      {
        ...params,
        data: {
          ...createTestInput,
        },
      },
      AdminTestDto,
    );
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiResponse({
    status: HttpStatus.OK,
    model: AdminTestDto,
    isArray: true,
  })
  @Get()
  findAll(@Query() params: Prisma.TestFindManyArgs) {
    return this.testService.findAll(params, AdminTestDto);
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiPaginationResponse(AdminTestDto)
  @Get('/pagination')
  findAllPagination(@Query() params: Prisma.TestFindManyArgs) {
    return this.testService.findAllPagination(params, AdminTestDto);
  }

  @ApiQuery({
    type: FindOneArgs,
  })
  @OpenApiResponse({ status: HttpStatus.OK, model: AdminTestDto })
  @Get(':id')
  findOne(@Param('id') id: string, @Query() params: Prisma.TestFindUniqueArgs) {
    params.where = {
      id,
    };
    return this.testService.findOne(params, AdminTestDto);
  }

  @OpenApiResponse({ status: HttpStatus.OK, model: AdminTestDto })
  @Patch(':id/published')
  published(@Param('id') id: string) {
    return this.testService.update(
      {
        where: {
          id,
        },
        data: {
          publishedAt: new Date(),
        },
      },
      AdminTestDto,
    );
  }

  @OpenApiResponse({ status: HttpStatus.OK, model: AdminTestDto })
  @Patch(':id/un-published')
  unPublished(@Param('id') id: string) {
    return this.testService.update(
      {
        where: {
          id,
        },
        data: {
          publishedAt: null,
        },
      },
      AdminTestDto,
    );
  }
  @OpenApiResponse({ status: HttpStatus.OK, model: AdminTestDto })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTestInput: UpdateAdminTestInput,
    @Query() params: Omit<Prisma.TestUpdateArgs, 'data' | 'where'>,
  ) {
    return this.testService.update(
      {
        ...params,
        where: {
          id,
        },
        data: {
          ...updateTestInput,
        },
      },
      AdminTestDto,
    );
  }

  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDto })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testService.remove({
      id,
    });
  }
}
