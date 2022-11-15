import * as dotenv from 'dotenv';
dotenv.config({ override: true });
import * as moduleAlias from 'module-alias';
moduleAlias.addAliases({
  '@modules': `${__dirname}/modules`,
  '@src': `${__dirname}`,
});
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as httpContext from 'express-http-context';
import {
  FilterPipe,
  GlobalApiLoggerMiddleware,
  GlobalExceptionFilter,
  isDevelopment,
  ResponseInterceptor,
  TransformInterceptor,
} from '@moonlightjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { setupSwagger } from 'src/setup-swagger';
import path from 'path';

console.log(__dirname);
// set default root folder path
process.env.ROOT_FOLDER =
  process.env.ROOT_FOLDER ?? __dirname.replace('/dist/src', '');
console.log(process.env.ROOT_FOLDER);

const PORT = process.env.PORT || 1999;
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //setup prisma
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalPipes(new FilterPipe());
  app.enableCors();
  app.use(httpContext.middleware);
  app.use('/api', GlobalApiLoggerMiddleware);
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  if (isDevelopment()) {
    setupSwagger(app);
  }
  await app.listen(PORT, () =>
    console.log(`🚀 Server ready at http://localhost:${PORT}`),
  );
}
bootstrap().then();
