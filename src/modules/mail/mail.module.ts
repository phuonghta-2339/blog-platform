import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@/database/database.module';
import { SettingsModule } from '@/common/settings/settings.module';
import { ConfigKeys } from '@/common/constants/config-keys';
import { MailService } from './mail.service';
import { MailWorker } from './workers/mail.worker';
import {
  MAIL_QUEUE_NAME,
  BULL_BOARD_CONFIG,
} from './constants/mail-queue.constants';
import { mailProviderFactory } from './providers/mail-provider.factory';
import { BullBoardController } from './controllers/bull-board.controller';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          // REDIS_HOST and REDIS_PORT are required by validation schema
          host: configService.get<string>(ConfigKeys.REDIS.HOST)!,
          port: configService.get<number>(ConfigKeys.REDIS.PORT)!,
          password:
            configService.get<string>(ConfigKeys.REDIS.PASSWORD) || undefined,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: MAIL_QUEUE_NAME,
    }),
    BullBoardModule.forRoot({
      route: BULL_BOARD_CONFIG.UI_PATH,
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: MAIL_QUEUE_NAME,
      adapter: BullMQAdapter,
    }),
    DatabaseModule,
    SettingsModule,
  ],
  controllers: [BullBoardController],
  providers: [
    MailService,
    MailWorker,
    mailProviderFactory, // Dynamic provider selection via factory
  ],
  exports: [BullModule, MailService, BullBoardModule],
})
export class MailModule {}
