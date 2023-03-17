import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PagedResultDto,
  Pagination,
  toDto,
  HttpErrorException,
} from '@moonlightjs/common';
import { PrismaService } from '@moonlightjs/common';
import { DemoDto } from './dto/demo.dto';
import { UpdateDemoInput } from './dto/update-demo.input';
import { CreateDemoInput } from './dto/create-demo.input';

const DEFAULT_SKIP = 0;
const DEFAULT_TAKE = 20;

@Injectable()
export class DemoService {
  constructor(protected prisma: PrismaService) {}

  async findOne<TDto = any>(
    params: Prisma.DemoFindFirstArgs,
    dtoType = DemoDto,
  ): Promise<TDto> {
    const demo = await this.prisma.demo.findFirst(params);
    return toDto<TDto>(dtoType, demo);
  }

  async findAll<TDto = any>(
    params: Prisma.DemoFindManyArgs,
    dtoType = DemoDto,
  ): Promise<TDto[]> {
    params.skip = params.skip ?? DEFAULT_SKIP;
    params.take = params.take ?? DEFAULT_TAKE;
    const demos = await this.prisma.demo.findMany(params);
    return demos.map((demo) => toDto<TDto>(dtoType, demo));
  }

  async findAllPagination<TDto = any>(
    params: Prisma.DemoFindManyArgs,
    dtoType = DemoDto,
  ): Promise<PagedResultDto<TDto>> {
    params.skip = params.skip ?? DEFAULT_SKIP;
    params.take = params.take ?? DEFAULT_TAKE;
    const [demos, total] = await Promise.all([
      this.prisma.demo.findMany(params),
      this.prisma.demo.count({
        where: params.where,
      }),
    ]);
    return PagedResultDto.create({
      data: demos.map((demo) => toDto<TDto>(dtoType, demo)),
      pagination: Pagination.create({
        take: params.take,
        skip: params.skip,
        total: total,
      }),
    });
  }

  async create<TDto = any>(
    params: Prisma.DemoCreateArgs,
    dtoType = DemoDto,
  ): Promise<TDto> {
    const demo = await this.prisma.demo.create(params);
    return toDto<TDto>(dtoType, demo);
  }

  async update<TDto = any>(
    params: Prisma.DemoUpdateArgs,
    dtoType = DemoDto,
  ): Promise<TDto> {
    const demo = await this.prisma.demo.update(params);
    return toDto<TDto>(dtoType, demo);
  }

  async remove(where: Prisma.DemoWhereUniqueInput): Promise<boolean> {
    const demo = await this.prisma.demo.delete({
      where,
    });
    return !!demo;
  }
}
