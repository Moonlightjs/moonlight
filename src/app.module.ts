import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  AdminAuthenticationModule,
  AdminAuthorizationModule,
  AdminPermissionsGuard,
  AdminRolesGuard,
  AdminUserModule,
} from '@moonlightjs/admin-user-module/modules';
import { APP_GUARD } from '@nestjs/core';
import {
  ContentTypeBuilderModule,
  ModuleLoaderModule,
} from '@moonlightjs/content-type-builder-module';
import { ConfigModule } from '@nestjs/config';
import { logQueryEvent, PrismaModule } from '@moonlightjs/common';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        prismaOptions: {
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
        },
        events: {
          query: logQueryEvent,
        },
      },
    }),
    AdminAuthenticationModule,
    AdminAuthorizationModule,
    AdminUserModule,
    ContentTypeBuilderModule,
    ModuleLoaderModule.register({
      name: 'content-type',
      /**
       * Make sure the path resolves to the **DIST** subdirectory, (we are no longer in TS land but JS land!)
       */
      path: path.resolve(__dirname, './content-type'),
      fileSpec: '**/*.module{.ts,.js}',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AdminRolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AdminPermissionsGuard,
    },
  ],
})
export class AppModule {}
