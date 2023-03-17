import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PagedResultDto,
  Pagination,
  toDto,
  HttpErrorException,
} from '@moonlightjs/common';
import { PrismaService } from '@moonlightjs/common';
import { TestDto } from './dto/test.dto';
import { UpdateTestInput } from './dto/update-test.input';
import { CreateTestInput } from './dto/create-test.input';

const DEFAULT_SKIP = 0;
const DEFAULT_TAKE = 20;

@Injectable()
export class TestService {
  constructor(protected prisma: PrismaService) {}

  async findOne<TDto = any>(
    params: Prisma.TestFindFirstArgs,
    dtoType = TestDto,
  ): Promise<TDto> {
    const test = await this.prisma.test.findFirst(params);
    return toDto<TDto>(dtoType, test);
  }

  async findAll<TDto = any>(
    params: Prisma.TestFindManyArgs,
    dtoType = TestDto,
  ): Promise<TDto[]> {
    params.skip = params.skip ?? DEFAULT_SKIP;
    params.take = params.take ?? DEFAULT_TAKE;
    const tests = await this.prisma.test.findMany(params);
    return tests.map((test) => toDto<TDto>(dtoType, test));
  }

  async findAllPagination<TDto = any>(
    params: Prisma.TestFindManyArgs,
    dtoType = TestDto,
  ): Promise<PagedResultDto<TDto>> {
    params.skip = params.skip ?? DEFAULT_SKIP;
    params.take = params.take ?? DEFAULT_TAKE;
    const [tests, total] = await Promise.all([
      this.prisma.test.findMany(params),
      this.prisma.test.count({
        where: params.where,
      }),
    ]);
    return PagedResultDto.create({
      data: tests.map((test) => toDto<TDto>(dtoType, test)),
      pagination: Pagination.create({
        take: params.take,
        skip: params.skip,
        total: total,
      }),
    });
  }

  async create<TDto = any>(
    params: Prisma.TestCreateArgs,
    dtoType = TestDto,
  ): Promise<TDto> {
    const test = await this.prisma.test.create(params);
    return toDto<TDto>(dtoType, test);
  }

  async update<TDto = any>(
    params: Prisma.TestUpdateArgs,
    dtoType = TestDto,
  ): Promise<TDto> {
    const test = await this.prisma.test.update(params);
    return toDto<TDto>(dtoType, test);
  }

  async remove(where: Prisma.TestWhereUniqueInput): Promise<boolean> {
    const test = await this.prisma.test.delete({
      where,
    });
    return !!test;
  }
}
