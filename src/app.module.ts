import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import {
  ALLOWED_EXTENSIONS,
  LOCAL_STORAGE_CONFIG,
} from '@/modules/storage/constants/storage.constants';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './common/cache/cache.module';
import { SettingsModule } from './common/settings/settings.module';
import {
  appConfig,
  databaseConfig,
  redisConfig,
  mailConfig,
  storageConfig,
  AppConfigService,
} from './config';
import { configValidationSchema } from './config/validation.schema';
import { V1Module } from './v1';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, mailConfig, storageConfig],
      validationSchema: configValidationSchema,
      cache: true,
      expandVariables: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), LOCAL_STORAGE_CONFIG.UPLOAD_DIR),
      serveRoot: LOCAL_STORAGE_CONFIG.URL_PREFIX,
      serveStaticOptions: {
        dotfiles: 'deny',
        etag: true,
        extensions: [...ALLOWED_EXTENSIONS],
        index: false,
      },
      exclude: ['/api/(.*)', '/health', '/admin/(.*)'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 3, // 3 requests
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests
      },
      {
        name: 'long',
        ttl: 900000, // 15 minutes
        limit: 100, // 100 requests
      },
    ]),
    DatabaseModule,
    CacheModule,
    SettingsModule,
    NotificationsModule,
    ReportsModule,
    V1Module,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppConfigService,
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
