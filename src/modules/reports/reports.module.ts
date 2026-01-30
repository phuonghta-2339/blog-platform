import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ArticlesModule } from '@modules/articles/articles.module';
import { FavoritesModule } from '@modules/favorites/favorites.module';
import { MailModule } from '@/modules/mail/mail.module';
import { ReportsService } from './reports.service';
import { ReportWorker } from './workers/report.worker';
import {
  REPORTS_QUEUE_NAME,
  ReportJobName,
  CRON_DAILY_MIDNIGHT,
  REPORT_JOB_CONFIG,
  REPORT_CONFIG_KEYS,
  REPORT_JOB_IDS,
} from './constants/reports.constants';

@Module({
  imports: [
    ConfigModule,
    ArticlesModule,
    FavoritesModule,
    MailModule,
    BullModule.registerQueue({
      name: REPORTS_QUEUE_NAME,
    }),
  ],
  providers: [ReportsService, ReportWorker],
  exports: [ReportsService],
})
export class ReportsModule implements OnModuleInit {
  constructor(
    @InjectQueue(REPORTS_QUEUE_NAME) private readonly reportsQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Schedule the daily report job if it doesn't verify existence (handled by repeatable logic)
    const cronSchedule = this.configService.get<string>(
      REPORT_CONFIG_KEYS.ADMIN_REPORT_CRON,
      CRON_DAILY_MIDNIGHT,
    );

    await this.reportsQueue.add(
      ReportJobName.DAILY_ENGAGEMENT_STATS,
      {},
      {
        repeat: {
          pattern: cronSchedule,
        },
        jobId: REPORT_JOB_IDS.ADMIN_REPORT_DAILY,
        ...REPORT_JOB_CONFIG,
      },
    );
  }
}
