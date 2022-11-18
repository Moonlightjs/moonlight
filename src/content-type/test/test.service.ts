import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PagedResultDto,
  Pagination,
  toDto,
  HttpErrorException,
} from '@moonlightjs/common';
import { PrismaService } from '@src/infra/prisma/prisma.service';
import { TestDto } from './dto/test.dto';
import { UpdateTestInput } from './dto/update-test.input';
import { CreateTestInput } from './dto/create-test.input';

const DEFAULT_SKIP = 0;
const DEFAULT_TAKE = 20;

@Injectable()
export class TestService {
  constructor(protected prisma: PrismaService) {}

  async findOne(params: Prisma.TestFindFirstArgs): Promise<TestDto> {
    const test = await this.prisma.test.findFirst(params);
    return toDto<TestDto>(TestDto, test);
  }

  async findAll(params: Prisma.TestFindManyArgs): Promise<TestDto[]> {
    params.skip = params.skip ?? DEFAULT_SKIP;
    params.take = params.take ?? DEFAULT_TAKE;
    const tests = await this.prisma.test.findMany(params);
    return tests.map((test) => toDto<TestDto>(TestDto, test));
  }

  async findAllPagination(
    params: Prisma.TestFindManyArgs,
  ): Promise<PagedResultDto<TestDto>> {
    params.skip = params.skip ?? DEFAULT_SKIP;
    params.take = params.take ?? DEFAULT_TAKE;
    const [tests, total] = await Promise.all([
      this.prisma.test.findMany(params),
      this.prisma.test.count({
        where: params.where,
      }),
    ]);
    return PagedResultDto.create({
      data: tests.map((test) => toDto<TestDto>(TestDto, test)),
      pagination: Pagination.create({
        take: params.take,
        skip: params.skip,
        total: total,
      }),
    });
  }

  async create(params: Prisma.TestCreateArgs): Promise<TestDto> {
    const test = await this.prisma.test.create(params);
    return toDto<TestDto>(TestDto, test);
  }

  async update(params: Prisma.TestUpdateArgs): Promise<TestDto> {
    const test = await this.prisma.test.update(params);
    return toDto<TestDto>(TestDto, test);
  }

  async remove(where: Prisma.TestWhereUniqueInput): Promise<boolean> {
    const test = await this.prisma.test.delete({
      where,
    });
    return !!test;
  }
}
