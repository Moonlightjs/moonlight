import {
  BadRequestException,
  INestApplication,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as httpContext from 'express-http-context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  protected readonly logger = new Logger(PrismaService.name);
  constructor() {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'stdout',
          level: 'error',
        },
        {
          emit: 'stdout',
          level: 'info',
        },
        {
          emit: 'stdout',
          level: 'warn',
        },
      ],
      errorFormat: 'colorless',
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    this.$on('query', (e: any) => {
      this.logger.verbose(
        '================================================================',
      );
      this.logger.verbose('Query: ' + e.query);
      this.logger.verbose('Params: ' + e.params);
      this.logger.verbose('Duration: ' + e.duration + 'ms');
      this.logger.verbose(
        '================================================================',
      );
    });

    this.$use(async (params, next) => {
      const user = httpContext.get('user');
      const originalUrl = httpContext.get('originalUrl') as string;
      if (user) {
        if (params.action === 'create') {
          params.args.data.createdById = user.sub;
          params.args.data.createdBy = user.username;
        }
        if (params.action === 'update') {
          params.args.data.updatedById = user.sub;
          params.args.data.updatedBy = user.username;
        }
        if (params.action === 'update') {
          params.args.data.deletedById = user.sub;
          params.args.data.deletedBy = user.username;
        }
      }
      return next(params);
    });
  }
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
