import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminAuthenticationModule } from '@moonlightjs/admin-user-module/modules/admin-authentication/admin-authentication.module';
import { AdminPermissionsGuard } from '@moonlightjs/admin-user-module/modules/admin-authorization/permission';
import { AdminAuthorizationModule } from '@moonlightjs/admin-user-module/modules/admin-authorization/admin-authorization.module';
import { AdminRolesGuard } from '@moonlightjs/admin-user-module/modules/admin-authorization/role';
import { AdminUserModule } from '@moonlightjs/admin-user-module/modules/admin-user/admin-user.module';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ContentTypeBuilderModule } from './modules/content-type-builder/content-type-builder.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AdminAuthenticationModule,
    AdminAuthorizationModule,
    AdminUserModule,
    ContentTypeBuilderModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
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
