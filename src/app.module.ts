import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { appConfig, databaseConfig, AppConfigService } from './config';
import { configValidationSchema } from './config/validation.schema';
import { V1Module } from './v1';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      validationSchema: configValidationSchema,
      cache: true,
      expandVariables: true,
    }),
    DatabaseModule,
    V1Module,
  ],
  controllers: [AppController],
  providers: [AppService, AppConfigService],
})
export class AppModule {}
