import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PagedResultDto,
  Pagination,
  toDto,
  HttpErrorException,
} from '@moonlightjs/common';
import { PrismaService } from '@src/infra/prisma/prisma.service';
import { DemoDto } from './dto/demo.dto';
import { UpdateDemoInput } from './dto/update-demo.input';
import { CreateDemoInput } from './dto/create-demo.input';

const DEFAULT_SKIP = 0;
const DEFAULT_TAKE = 20;

@Injectable()
export class DemoService {
  constructor(protected prisma: PrismaService) {}

  async findOne(params: Prisma.DemoFindFirstArgs): Promise<DemoDto> {
    const demo = await this.prisma.demo.findFirst(params);
    return toDto<DemoDto>(DemoDto, demo);
  }

  async findAll(params: Prisma.DemoFindManyArgs): Promise<DemoDto[]> {
    params.skip = params.skip ?? DEFAULT_SKIP;
    params.take = params.take ?? DEFAULT_TAKE;
    const demos = await this.prisma.demo.findMany(params);
    return demos.map((demo) => toDto<DemoDto>(DemoDto, demo));
  }

  async findAllPagination(
    params: Prisma.DemoFindManyArgs,
  ): Promise<PagedResultDto<DemoDto>> {
    params.skip = params.skip ?? DEFAULT_SKIP;
    params.take = params.take ?? DEFAULT_TAKE;
    const [demos, total] = await Promise.all([
      this.prisma.demo.findMany(params),
      this.prisma.demo.count({
        where: params.where,
      }),
    ]);
    return PagedResultDto.create({
      data: demos.map((demo) => toDto<DemoDto>(DemoDto, demo)),
      pagination: Pagination.create({
        take: params.take,
        skip: params.skip,
        total: total,
      }),
    });
  }

  async create(params: Prisma.DemoCreateArgs): Promise<DemoDto> {
    const demo = await this.prisma.demo.create(params);
    return toDto<DemoDto>(DemoDto, demo);
  }

  async update(params: Prisma.DemoUpdateArgs): Promise<DemoDto> {
    const demo = await this.prisma.demo.update(params);
    return toDto<DemoDto>(DemoDto, demo);
  }

  async remove(where: Prisma.DemoWhereUniqueInput): Promise<boolean> {
    const demo = await this.prisma.demo.delete({
      where,
    });
    return !!demo;
  }
}
